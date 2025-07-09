import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CompanyService } from '../company/company.service';
import { UserService } from '../user/user.service';
import {
  OnboardingSession,
  OnboardingSessionDocument,
} from './schema/onboarding-session.schema';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(OnboardingSession.name)
    private readonly sessionModel: Model<OnboardingSessionDocument>,
    private readonly companyService: CompanyService,
    private readonly userService: UserService,
  ) {}

  /**
   * 保存用户某一步的回答
   */
  async saveAnswer(
    userId: string,
    stepId: number,
    answer: string,
    field: string,
  ): Promise<{ success: boolean; currentStep: number }> {
    await this.sessionModel.updateOne(
      { userId },
      {
        $set: {
          [`answers.${field}`]: answer,
          updatedAt: new Date(),
        },
        $setOnInsert: { currentStep: 1, status: 'in_progress' },
      },
      { upsert: true },
    );

    if (field.startsWith('user.')) {
      const [, key] = field.split('.');
      await this.userService.patch(userId, { [key]: answer });
    }

    return {
      success: true,
      currentStep: stepId + 1,
    };
  }

  /**
   * 查询当前用户的 Onboarding 状态和填写进度
   */
  async getProgress(userId: string): Promise<{
    currentStep: number;
    answers: Record<string, string>;
    status: string;
  }> {
    const session = await this.sessionModel.findOne({ userId }).lean();

    if (!session) {
      return {
        currentStep: 1,
        answers: {},
        status: 'in_progress',
      };
    }

    return {
      currentStep: session.currentStep,
      answers: session.answers,
      status: session.status,
    };
  }

  /**
   * 标记用户 Onboarding 为已完成
   */
  async completeSession(userId: string): Promise<{ success: boolean }> {
    const session = await this.sessionModel.findOne({ userId }).lean();
    if (!session) throw new NotFoundException('session not found');

    const a = session.answers;
    const companyPayload = {
      businessName: a['company.businessName'],
      address: {
        unitAptPOBox: a['company.address.unitAptPOBox'] ?? '',
        streetAddress: a['company.address.streetAddress'],
        suburb: a['company.address.suburb'],
        state: a['company.address.state'],
        postcode: a['company.address.postcode'],
      },
      email: a['company.email'],
      abn: a['company.abn'],
      number: a['company.number'],
      user: userId,
    };

    await this.companyService.create(companyPayload);

    await this.sessionModel.updateOne(
      { userId },
      { status: 'completed', updatedAt: new Date() },
    );

    return { success: true };
  }

  /**
   * 删除指定用户的 Onboarding Session
   */
  async deleteSession(userId: string): Promise<{ success: boolean }> {
    const result = await this.sessionModel.deleteOne({ userId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User session not found: ${userId}`);
    }

    return { success: true };
  }

  /**
   * 获取所有用户的 Onboarding Session 列表
   */
  async getAllSessions() {
    return this.sessionModel
      .find()
      .select('-__v') // 去掉 __v 版本字段，按需保留
      .lean()
      .exec();
  }
}
