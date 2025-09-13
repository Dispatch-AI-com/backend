import { getModelToken } from '@nestjs/mongoose';
import type { TestingModule } from '@nestjs/testing';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';

import type { CallLog } from '../../src/modules/calllog/schema/calllog.schema';
import type { Company } from '../../src/modules/company/schema/company.schema';
import type { Setting } from '../../src/modules/setting/schema/setting.schema';
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
  private settingModel: Model<Setting>;
  private userModel: Model<User>;
  private companyModel: Model<Company>;
  private planModel: Model<Plan>;
  private subscriptionModel: Model<Subscription>;
  private serviceBookingModel: Model<ServiceBooking>;
  private serviceModel: Model<Service>;

  constructor(private moduleRef: TestingModule) {
    this.callLogModel = moduleRef.get<Model<CallLog>>(getModelToken('CallLog'));
    this.transcriptModel = moduleRef.get<Model<Transcript>>(
      getModelToken('Transcript'),
    );
    this.transcriptChunkModel = moduleRef.get<Model<TranscriptChunk>>(
      getModelToken('TranscriptChunk'),
    );
    this.settingModel = moduleRef.get<Model<Setting>>(getModelToken('Setting'));
    this.userModel = moduleRef.get<Model<User>>(getModelToken('User'));
    this.companyModel = moduleRef.get<Model<Company>>(getModelToken('Company'));
    this.planModel = moduleRef.get<Model<Plan>>(getModelToken('Plan'));
    this.subscriptionModel = moduleRef.get<Model<Subscription>>(getModelToken('Subscription'));
    this.serviceBookingModel = moduleRef.get<Model<ServiceBooking>>(
      getModelToken('ServiceBooking'),
    );
    this.serviceModel = moduleRef.get<Model<Service>>(getModelToken('Service'));
  }

  async cleanupAll(): Promise<void> {
    await Promise.all([
      this.transcriptChunkModel.deleteMany({}),
      this.transcriptModel.deleteMany({}),
      this.callLogModel.deleteMany({}),
      this.settingModel.deleteMany({}),
      this.userModel.deleteMany({}),
      this.companyModel.deleteMany({}),
      this.planModel.deleteMany({}),
      this.subscriptionModel.deleteMany({}),
      this.serviceBookingModel.deleteMany({}),
      this.serviceModel.deleteMany({}),
    ]);
  }

  async seedBasicData(): Promise<void> {
    await this.callLogModel.create(mockCallLog);
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

  async verifyTranscriptExists(transcriptId: string): Promise<boolean> {
    const transcript = await this.transcriptModel.findById(transcriptId);
    return !!transcript;
  }

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

  // Accessors for tests that need direct model access
  get userModelAccessor() {
    return this.userModel;
  }

  get planModelAccessor() {
    return this.planModel;
  }

  get subscriptionModelAccessor() {
    return this.subscriptionModel;
  }

  // Calendar-related helpers
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

  // Company helper
  async createCompany(
    company: Partial<Omit<Company, 'user'>> & { user?: any } = {} as any,
  ) {
    const uniqueAbn = (
      Date.now().toString() + Math.floor(Math.random() * 1000).toString()
    ).slice(0, 11);

    const address = (company.address as any) || {};

    const companyObj: any = {
      businessName: company.businessName || 'Test Business',
      address: {
        unitAptPOBox: address.unitAptPOBox || '',
        streetAddress: address.streetAddress || '123 Test St',
        suburb: address.suburb || 'Testville',
        state: address.state || 'TS',
        postcode: address.postcode || '1234',
      },
      abn: company.abn || uniqueAbn,
      user:
        typeof company.user === 'string'
          ? new Types.ObjectId(company.user)
          : company.user || new Types.ObjectId(),
    };

    if (
      company.twilioPhoneNumber !== undefined &&
      company.twilioPhoneNumber !== null
    ) {
      companyObj.twilioPhoneNumber = company.twilioPhoneNumber;
    }

    return await this.companyModel.create(companyObj);
  }
}


