import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoogleCalendarAuth, GoogleCalendarAuthDocument } from './schema/google-calendar-auth.schema';

@Injectable()
export class GoogleCalendarAuthService {
  constructor(
    @InjectModel(GoogleCalendarAuth.name)
    private readonly googleCalendarAuthModel: Model<GoogleCalendarAuthDocument>,
  ) {}

  async getAuthByUserId(userId: Types.ObjectId | string) {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return this.googleCalendarAuthModel.findOne({ userId: userIdObj });
  }

  async upsertAuth(
    userId: Types.ObjectId | string, 
    accessToken: string, 
    refreshToken?: string, 
    tokenExpiresAt?: Date
  ) {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return this.googleCalendarAuthModel.findOneAndUpdate(
      { userId: userIdObj },
      { accessToken, refreshToken, tokenExpiresAt },
      { upsert: true, new: true }
    );
  }

  async deleteAuth(userId: Types.ObjectId | string) {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    return this.googleCalendarAuthModel.findOneAndDelete({ userId: userIdObj });
  }

  async isAuthorized(userId: Types.ObjectId | string): Promise<boolean> {
    const auth = await this.getAuthByUserId(userId);
    if (!auth || !auth.accessToken) return false;
    
    // 检查 token 是否过期
    if (auth.tokenExpiresAt && new Date() > auth.tokenExpiresAt) {
      return false;
    }
    
    return true;
  }
} 