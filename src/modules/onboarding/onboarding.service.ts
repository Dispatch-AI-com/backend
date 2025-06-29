import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  OnboardingSession,
  OnboardingSessionDocument,
} from './schema/onboarding-session.schema';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(OnboardingSession.name)
    private readonly sessionModel: Model<OnboardingSessionDocument>,
  ) {}

  /**
   * 保存用户某一步的回答
   */
  async saveAnswer(
    userId: string,
    stepId: number,
    answer: string,
  ): Promise<{ success: boolean; currentStep: number }> {
    const update = {
      $set: {
        [`answers.${stepId.toString()}`]: answer,
        currentStep: stepId + 1,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        status: 'in_progress',
      },
    };

    await this.sessionModel.updateOne({ userId }, update, { upsert: true });

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
      answers: session.answers || {},
      status: session.status,
    };
  }

  /**
   * 标记用户 Onboarding 为已完成
   */
  async completeSession(userId: string): Promise<{ success: boolean }> {
    const result = await this.sessionModel.findOneAndUpdate(
      { userId },
      { status: 'completed', updatedAt: new Date() },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException(`User session not found: ${userId}`);
    }

    return { success: true };
  }
}
