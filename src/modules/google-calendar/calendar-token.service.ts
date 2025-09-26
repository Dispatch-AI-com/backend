import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateCalendarTokenDto } from './dto/create-calendar-token.dto';
import {
  CalendarToken,
  CalendarTokenDocument,
} from './schema/calendar-token.schema';
import { CalendarOAuthService } from './services/calendar-oauth.service';

@Injectable()
export class CalendarTokenService {
  constructor(
    @InjectModel(CalendarToken.name)
    private readonly calendarTokenModel: Model<CalendarTokenDocument>,
    private readonly calendarOAuthService: CalendarOAuthService,
  ) {}

  /**
   * Get a valid access token by user ID.
   * If the token expires in less than 15 minutes, mark it as needing refresh.
   */
  async getValidToken(userId: string): Promise<{
    accessToken: string;
    needsRefresh: boolean;
    expiresAt: Date;
  }> {
    const token = await this.calendarTokenModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!token) {
      throw new NotFoundException(`No calendar token found for user ${userId}`);
    }

    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const fifteenMinutesInMs = 15 * 60 * 1000; // 15 minutes

    // Mark as needing refresh if time to expiry < 15 minutes
    const needsRefresh = timeUntilExpiry < fifteenMinutesInMs;

    return {
      accessToken: token.accessToken,
      needsRefresh,
      expiresAt: expiresAt,
    };
  }

  /**
   * Refresh access token.
   */
  async refreshToken(userId: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    const token = await this.calendarTokenModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!token) {
      throw new NotFoundException(`No calendar token found for user ${userId}`);
    }

    if (!token.refreshToken) {
      throw new UnauthorizedException(
        'No refresh token available. Please re-authorize Calendar.',
      );
    }

    try {
      const refreshed =
        await this.calendarOAuthService.refreshGoogleAccessToken(
          token.refreshToken,
        );
      const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);

      await this.calendarTokenModel.findByIdAndUpdate(token._id, {
        accessToken: refreshed.accessToken,
        expiresAt: newExpiresAt,
        tokenType: refreshed.tokenType ?? token.tokenType,
        scope: refreshed.scope ?? token.scope,
        updatedAt: new Date(),
      });

      return {
        accessToken: refreshed.accessToken,
        expiresAt: newExpiresAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Optional: mark token inactive on hard failures
      // await this.calendarTokenModel.findByIdAndUpdate(token._id, { isActive: false, updatedAt: new Date() });
      throw new UnauthorizedException(
        `Failed to refresh access token: ${message}`,
      );
    }
  }

  /**
   * Create or update calendar token.
   */
  async createOrUpdateToken(
    createDto: CreateCalendarTokenDto,
  ): Promise<CalendarToken> {
    const { userId } = createDto;

    // Find existing token
    const existingToken = await this.calendarTokenModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    if (existingToken) {
      // Update existing token
      const updatedToken = await this.calendarTokenModel.findByIdAndUpdate(
        existingToken._id,
        {
          accessToken: createDto.accessToken,
          refreshToken: createDto.refreshToken,
          expiresAt: new Date(createDto.expiresAt),
          tokenType: createDto.tokenType,
          scope: createDto.scope,
          calendarId: createDto.calendarId,
          updatedAt: new Date(),
        },
        { new: true },
      );
      if (!updatedToken) {
        throw new Error('Failed to update token');
      }
      return updatedToken;
    } else {
      // Create new token (avoid spreading class instance to preserve prototype)
      const newTokenPayload: Partial<CalendarToken> & {
        userId: Types.ObjectId;
        expiresAt: Date;
      } = {
        userId: new Types.ObjectId(createDto.userId),
        provider: 'google',
        accessToken: createDto.accessToken,
        refreshToken: createDto.refreshToken,
        expiresAt: new Date(createDto.expiresAt),
        tokenType: createDto.tokenType,
        scope: createDto.scope,
        calendarId: (createDto as any).calendarId,
      };
      const newToken = new this.calendarTokenModel(newTokenPayload);
      return await newToken.save();
    }
  }

  /**
   * Get user's calendar token.
   */
  async getUserToken(
    userId: string,
    provider = 'google',
  ): Promise<CalendarToken | null> {
    return await this.calendarTokenModel.findOne({
      userId: new Types.ObjectId(userId),
      provider,
      isActive: true,
    });
  }

  /**
   * Soft-delete user's calendar token.
   */
  async deleteUserToken(userId: string, provider = 'google'): Promise<void> {
    await this.calendarTokenModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        provider,
      },
      {
        isActive: false,
        updatedAt: new Date(),
      },
    );
  }

  /**
   * Check if token is expiring soon (less than 15 minutes).
   */
  async isTokenExpiringSoon(
    userId: string,
    provider = 'google',
  ): Promise<boolean> {
    const token = await this.getUserToken(userId, provider);
    if (!token) return false;

    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const fifteenMinutesInMs = 15 * 60 * 1000;

    return timeUntilExpiry < fifteenMinutesInMs;
  }
}
