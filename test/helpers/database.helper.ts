import { getModelToken } from '@nestjs/mongoose';
import type { TestingModule } from '@nestjs/testing';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';

import type { CallLog } from '../../src/modules/calllog/schema/calllog.schema';
import type { Transcript } from '../../src/modules/transcript/schema/transcript.schema';
import type { TranscriptChunk } from '../../src/modules/transcript-chunk/schema/transcript-chunk.schema';
import type { Plan } from '../../src/modules/plan/schema/plan.schema';
import type { Subscription } from '../../src/modules/subscription/schema/subscription.schema';
import type { User } from '../../src/modules/user/schema/user.schema';
import {
  staticCallLog as mockCallLog,
  staticTranscript as mockTranscript,
  staticTranscriptChunks as mockTranscriptChunks,
} from '../fixtures';

export class DatabaseTestHelper {
  private callLogModel: Model<CallLog>;
  private transcriptModel: Model<Transcript>;
  private transcriptChunkModel: Model<TranscriptChunk>;
  private planModel: Model<Plan>;
  private subscriptionModel: Model<Subscription>;
  private userModel: Model<User>;

  constructor(private moduleRef: TestingModule) {
    this.callLogModel = moduleRef.get<Model<CallLog>>(getModelToken('CallLog'));
    this.transcriptModel = moduleRef.get<Model<Transcript>>(
      getModelToken('Transcript'),
    );
    this.transcriptChunkModel = moduleRef.get<Model<TranscriptChunk>>(
      getModelToken('TranscriptChunk'),
    );
    this.planModel = moduleRef.get<Model<Plan>>(getModelToken('Plan'));
    this.subscriptionModel = moduleRef.get<Model<Subscription>>(getModelToken('Subscription'));
    this.userModel = moduleRef.get<Model<User>>(getModelToken('User'));
  }

  async cleanupAll(): Promise<void> {
    await Promise.all([
      this.transcriptChunkModel.deleteMany({}),
      this.transcriptModel.deleteMany({}),
      this.callLogModel.deleteMany({}),
      this.planModel.deleteMany({}),
      this.subscriptionModel.deleteMany({}),
      this.userModel.deleteMany({}),
    ]);
  }

  async seedBasicData(): Promise<void> {
    // Create CallLog first (dependency for Transcript)
    await this.callLogModel.create(mockCallLog);

    // Create Transcript (dependency for TranscriptChunk)
    await this.transcriptModel.create(mockTranscript);
  }

  async seedTranscriptChunks(): Promise<void> {
    await this.transcriptChunkModel.create(mockTranscriptChunks);
  }

  async createTestTranscriptChunk(data: any): Promise<any> {
    return await this.transcriptChunkModel.create(data);
  }

  async findTranscriptChunkById(id: string): Promise<any> {
    return await this.transcriptChunkModel.findById(id);
  }

  async countTranscriptChunks(filter: any = {}): Promise<number> {
    return await this.transcriptChunkModel.countDocuments(filter);
  }

  // Helper to verify transcript exists
  async verifyTranscriptExists(transcriptId: string): Promise<boolean> {
    const transcript = await this.transcriptModel.findById(transcriptId);
    return !!transcript;
  }

  // Helper to create duplicate chunk for testing
  async createDuplicateStartTimeChunk(
    transcriptId: string,
    startAt: number,
  ): Promise<any> {
    return await this.transcriptChunkModel.create({
      transcriptId: new Types.ObjectId(transcriptId),
      speakerType: 'AI',
      text: 'Original chunk',
      startAt,
    });
  }
}
