import { getModelToken } from '@nestjs/mongoose';
import type { TestingModule } from '@nestjs/testing';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';

import type { CallLog } from '../../src/modules/calllog/schema/calllog.schema';
import type { Service } from '../../src/modules/service/schema/service.schema';
import type { ServiceBooking } from '../../src/modules/service-booking/schema/service-booking.schema';
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
  private serviceBookingModel: Model<ServiceBooking>;
  private serviceModel: Model<Service>;
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
    this.serviceBookingModel = moduleRef.get<Model<ServiceBooking>>(
      getModelToken('ServiceBooking'),
    );
    this.serviceModel = moduleRef.get<Model<Service>>(getModelToken('Service'));
    this.userModel = moduleRef.get<Model<User>>(getModelToken('User'));
  }

  async cleanupAll(): Promise<void> {
    await Promise.all([
      this.transcriptChunkModel.deleteMany({}),
      this.transcriptModel.deleteMany({}),
      this.callLogModel.deleteMany({}),
      this.planModel.deleteMany({}),
      this.subscriptionModel.deleteMany({}),
      this.serviceBookingModel.deleteMany({}),
      this.serviceModel.deleteMany({}),
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

  // Public accessors for models
  get userModelAccessor() {
    return this.userModel;
  }

  get planModelAccessor() {
    return this.planModel;
  }

  get subscriptionModelAccessor() {
    return this.subscriptionModel;
  }
  // Calendar-related helper methods (for frontend calendar usage)
  async createServiceBooking(data: any): Promise<any> {
    return await this.serviceBookingModel.create(data);
  }

  async createService(data: any): Promise<any> {
    return await this.serviceModel.create(data);
  }

  async createUser(user: any): Promise<any> {
    return await this.userModel.create(user);
  }

  async countServiceBookings(filter: any = {}): Promise<number> {
    return await this.serviceBookingModel.countDocuments(filter);
  }

  async countServices(filter: any = {}): Promise<number> {
    return await this.serviceModel.countDocuments(filter);
  }
}
