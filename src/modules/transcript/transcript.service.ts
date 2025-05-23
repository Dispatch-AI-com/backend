import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CalllogService } from '../calllog/calllog.service';
import { CreateTranscriptDto, UpdateTranscriptDto } from './dto';
import { Transcript } from './schema/transcript.schema';
import { sanitizedUpdate } from './utils/sanitized-update';
import { TranscriptChunk } from '../transcript_chunk/schema/transcript_chunk.schema';

@Injectable()
export class TranscriptService {
  constructor(
    @InjectModel(Transcript.name)
    private readonly transcriptModel: Model<Transcript>,
    @InjectModel(TranscriptChunk.name)
    private readonly transcriptChunkModel: Model<TranscriptChunk>,
    private readonly calllogService: CalllogService,
  ) {}

  async create(dto: CreateTranscriptDto): Promise<Transcript> {
    // Verify that the referenced CallLog exists
    try {
      await this.calllogService.update(dto.calllogid.toString(), {});
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`CallLog with ID ${dto.calllogid} not found`);
      }
      throw error;
    }
    
    return this.transcriptModel.create(dto);
  }

  async findByCalllogId(calllogid: string): Promise<Transcript[]> {
    return this.transcriptModel.find({ calllogid }).exec();
  }

  async update(id: string, dto: UpdateTranscriptDto): Promise<Transcript> {
    const updated = await this.transcriptModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
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
