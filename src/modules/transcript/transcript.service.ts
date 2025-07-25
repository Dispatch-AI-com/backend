import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ITranscript } from '../../common/interfaces/transcript';
import { CallLog } from '../calllog/schema/calllog.schema';
import { TranscriptChunk } from '../transcript-chunk/schema/transcript-chunk.schema';
import { UpdateTranscriptDto } from './dto/update-transcript.dto';
import { Transcript, TranscriptDocument } from './schema/transcript.schema';

@Injectable()
export class TranscriptService {
  constructor(
    @InjectModel(Transcript.name)
    private readonly transcriptModel: Model<Transcript>,
    @InjectModel(TranscriptChunk.name)
    private readonly transcriptChunkModel: Model<TranscriptChunk>,
    @InjectModel(CallLog.name)
    private readonly callLogModel: Model<CallLog>,
  ) {}

  async create(dto: {
    callSid: string;
    summary: string;
    keyPoints?: string[];
  }): Promise<ITranscript> {
    const { callSid, summary, keyPoints } = dto;
    const calllog = await this.callLogModel.findOne({ callSid });
    if (!calllog) {
      throw new NotFoundException(`CallLog with callSid ${callSid} not found`);
    }
    const transcript = await this.transcriptModel.create({
      callSid,
      summary,
      keyPoints,
    });
    return this.convertToITranscript(transcript);
  }

  async findAll(): Promise<ITranscript[]> {
    const transcripts = await this.transcriptModel.find().exec();
    return transcripts.map(t => this.convertToITranscript(t));
  }

  async findByCallSid(callSid: string): Promise<ITranscript | null> {
    const transcript = await this.transcriptModel.findOne({ callSid }).exec();
    return transcript ? this.convertToITranscript(transcript) : null;
  }

  async findOne(id: string): Promise<ITranscript> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transcript id');
    }
    const transcript = await this.transcriptModel.findById(id);
    if (!transcript) throw new NotFoundException('Transcript not found');
    return this.convertToITranscript(transcript);
  }

  async update(id: string, dto: UpdateTranscriptDto): Promise<ITranscript> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transcript id');
    }

    const updateData: Partial<{
      summary: string;
      keyPoints: string[];
    }> = {};

    if (dto.summary !== undefined) {
      updateData.summary = dto.summary;
    }

    if (dto.keyPoints !== undefined) {
      updateData.keyPoints = dto.keyPoints;
    }

    const transcript = await this.transcriptModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!transcript) {
      throw new NotFoundException('Transcript not found');
    }

    return this.convertToITranscript(transcript);
  }

  async delete(id: string): Promise<ITranscript> {
    const deleted = await this.transcriptModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Transcript not found');
    await this.transcriptChunkModel.deleteMany({ transcriptId: id });
    return this.convertToITranscript(deleted);
  }

  async findByCallLogId(calllogId: string): Promise<ITranscript> {
    if (!Types.ObjectId.isValid(calllogId)) {
      throw new BadRequestException('Invalid calllogId');
    }

    // First find the CallLog by its ID
    const calllog = await this.callLogModel.findById(calllogId);
    if (!calllog) {
      throw new NotFoundException(`CallLog not found for id: ${calllogId}`);
    }

    // Then find the Transcript using the CallLog's callSid
    const transcript = await this.transcriptModel.findOne({
      callSid: calllog.callSid,
    });

    if (!transcript) {
      throw new NotFoundException(
        `Transcript not found for calllogId: ${calllogId}`,
      );
    }

    return this.convertToITranscript(transcript);
  }

  async deleteByCallLogId(calllogId: string): Promise<void> {
    if (!Types.ObjectId.isValid(calllogId)) {
      throw new BadRequestException('Invalid calllog ID');
    }

    // First find the CallLog by its ID
    const calllog = await this.callLogModel.findById(calllogId);
    if (!calllog) {
      throw new NotFoundException(`CallLog not found for id: ${calllogId}`);
    }

    // Then find the Transcript using the CallLog's callSid
    const transcript = await this.transcriptModel.findOne({
      callSid: calllog.callSid,
    });
    if (!transcript) {
      throw new NotFoundException(
        `Transcript not found for calllogId: ${calllogId}`,
      );
    }

    // Delete all chunks for this transcript
    await this.transcriptChunkModel.deleteMany({
      transcriptId: transcript._id,
    });

    // Delete the transcript
    await this.transcriptModel.deleteOne({ _id: transcript._id });
  }

  private convertToITranscript(doc: TranscriptDocument): ITranscript {
    const obj = doc.toObject();
    return {
      _id: obj._id.toString(),
      callSid: obj.callSid,
      summary: obj.summary,
      keyPoints: obj.keyPoints,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}
