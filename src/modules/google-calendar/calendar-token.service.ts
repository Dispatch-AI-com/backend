import {
  BadRequestException,
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

// Security helper functions to prevent NoSQL injection
function assertString(name: string, v: unknown): string {
  if (v == null) throw new BadRequestException(`Field "${name}" is required.`);
  if (typeof v !== 'string')
    throw new BadRequestException(`Field "${name}" must be a string.`);
  if (v.startsWith('$'))
    throw new BadRequestException(`Field "${name}" cannot start with "$".`);
  return v;
}

function toValidDate(name: string, v: unknown): Date {
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime()))
    throw new BadRequestException(`Field "${name}" must be a valid date.`);
  return d;
}

// defensively reject any nested $-operators if you ever accept objects
function rejectMongoOperators(obj: Record<string, unknown>) {
  for (const k of Object.keys(obj)) {
    if (k.startsWith('$')) throw new BadRequestException(`Illegal field: ${k}`);
    const val = obj[k];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      rejectMongoOperators(val as Record<string, unknown>);
    }
  }
}

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
   * Update stored Google user info fields without touching token values.
   */
  async updateUserInfo(userId: string, info: {
    googleUserId?: string;
    userEmail?: string;
    userName?: string;
    userPicture?: string;
  }): Promise<void> {
    const token = await this.calendarTokenModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });
    if (!token) return;

    await this.calendarTokenModel.findByIdAndUpdate(
      token._id,
      {
        $set: {
          googleUserId: info.googleUserId,
          userEmail: info.userEmail,
          userName: info.userName,
          userPicture: info.userPicture,
          updatedAt: new Date(),
        },
      },
      { runValidators: true, overwrite: false },
    );
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

      await this.calendarTokenModel.findByIdAndUpdate(
        token._id,
        {
          $set: {
            accessToken: refreshed.accessToken,
            expiresAt: newExpiresAt,
            tokenType: refreshed.tokenType ?? token.tokenType,
            scope: refreshed.scope ?? token.scope,
            updatedAt: new Date(),
          },
        },
        { new: false, runValidators: true, overwrite: false },
      );

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
    // (A) Optional deep guard (handles future DTO changes)
    rejectMongoOperators(createDto as unknown as Record<string, unknown>);

    // (B) Re-validate & normalize each field (whitelist only)
    const userIdStr = assertString('userId', createDto.userId);
    const accessToken = assertString('accessToken', createDto.accessToken);
    const refreshToken = assertString('refreshToken', createDto.refreshToken);
    const tokenType = assertString('tokenType', createDto.tokenType);
    const scope = assertString('scope', createDto.scope);
    const calendarId = assertString(
      'calendarId',
      (createDto as any).calendarId,
    );
    const expiresAt = toValidDate('expiresAt', createDto.expiresAt);

    // user info
    const googleUserId = (createDto as any).googleUserId
      ? assertString('googleUserId', (createDto as any).googleUserId)
      : undefined;
    const userEmail = (createDto as any).userEmail
      ? assertString('userEmail', (createDto as any).userEmail)
      : undefined;
    const userName = (createDto as any).userName
      ? assertString('userName', (createDto as any).userName)
      : undefined;
    const userPicture = (createDto as any).userPicture
      ? assertString('userPicture', (createDto as any).userPicture)
      : undefined;

    // Find existing token
    const existingToken = await this.calendarTokenModel.findOne({
      userId: new Types.ObjectId(userIdStr),
      isActive: true,
    });

    if (existingToken) {
      // Update existing token with $set and validators
      const updatedToken = await this.calendarTokenModel.findByIdAndUpdate(
        existingToken._id,
        {
          $set: {
            accessToken,
            refreshToken,
            expiresAt,
            tokenType,
            scope,
            calendarId,
            googleUserId,
            userEmail,
            userName,
            userPicture,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true, overwrite: false },
      );
      if (!updatedToken) {
        throw new Error('Failed to update token');
      }
      return updatedToken;
    } else {
      // Create new token (keep whitelist & types)
      const newTokenPayload: Partial<CalendarToken> & {
        userId: Types.ObjectId;
        expiresAt: Date;
      } = {
        userId: new Types.ObjectId(userIdStr),
        provider: 'google',
        accessToken,
        refreshToken,
        expiresAt,
        tokenType,
        scope,
        calendarId,
        googleUserId,
        userEmail,
        userName,
        userPicture,
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
      provider: { $eq: provider },
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
        provider: { $eq: provider },
      },
      {
        $set: { isActive: false, updatedAt: new Date() },
      },
      { runValidators: true, overwrite: false },
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
