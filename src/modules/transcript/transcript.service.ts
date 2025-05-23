import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CallLog } from '../calllog/schema/calllog.schema';
import { TranscriptChunk } from '../transcript_chunk/schema/transcript_chunk.schema';
import { CreateTranscriptDto, UpdateTranscriptDto } from './dto';
import { Transcript } from './schema/transcript.schema';
import { sanitizedUpdate } from './utils/sanitized-update';

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

  async create(dto: CreateTranscriptDto): Promise<Transcript> {
    if (!Types.ObjectId.isValid(dto.calllogid)) {
      throw new BadRequestException('Invalid calllogid');
    }
    const calllog = await this.callLogModel.findById(dto.calllogid);
    if (!calllog) {
      throw new NotFoundException(
        `CallLog with ID ${dto.calllogid.toString()} not found`,
      );
    }
    return this.transcriptModel.create(dto);
  }

  async findByCalllogId(calllogid: string): Promise<Transcript[]> {
    return this.transcriptModel.find({ calllogid }).exec();
  }

  async update(id: string, dto: UpdateTranscriptDto): Promise<Transcript> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transcript id');
    }
    const updated = await sanitizedUpdate(this.transcriptModel, id, dto);
    if (!updated) throw new NotFoundException('Transcript not found');
    return updated;
  }

  async sanitizedUpdate(
    id: string,
    dto: UpdateTranscriptDto,
  ): Promise<Transcript> {
    return sanitizedUpdate(this.transcriptModel, id, dto);
  }

  async delete(id: string): Promise<Transcript> {
    const deleted = await this.transcriptModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Transcript not found');
    await this.transcriptChunkModel.deleteMany({ transcriptId: id });
    return deleted;
  }
}
