import { getModelToken } from '@nestjs/mongoose';
import { TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { CallLog } from '../../src/modules/calllog/schema/calllog.schema';
import { Transcript } from '../../src/modules/transcript/schema/transcript.schema';
import { TranscriptChunk } from '../../src/modules/transcript-chunk/schema/transcript-chunk.schema';
import { 
  staticCallLog as mockCallLog, 
  staticTranscript as mockTranscript, 
  staticTranscriptChunks as mockTranscriptChunks 
} from '../fixtures';

export class DatabaseTestHelper {
  private callLogModel: Model<CallLog>;
  private transcriptModel: Model<Transcript>;
  private transcriptChunkModel: Model<TranscriptChunk>;

  constructor(private moduleRef: TestingModule) {
    this.callLogModel = moduleRef.get<Model<CallLog>>(getModelToken('CallLog'));
    this.transcriptModel = moduleRef.get<Model<Transcript>>(
      getModelToken('Transcript'),
    );
    this.transcriptChunkModel = moduleRef.get<Model<TranscriptChunk>>(
      getModelToken('TranscriptChunk'),
    );
  }

  async cleanupAll(): Promise<void> {
    await Promise.all([
      this.transcriptChunkModel.deleteMany({}),
      this.transcriptModel.deleteMany({}),
      this.callLogModel.deleteMany({}),
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
