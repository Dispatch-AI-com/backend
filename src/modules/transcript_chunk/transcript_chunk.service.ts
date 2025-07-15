import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';
import {
  TranscriptChunk,
  TranscriptChunkDocument,
} from './schema/transcript_chunk.schema';
import { sanitizedUpdate } from './utils/sanitized-update';

@Injectable()
export class TranscriptChunkService {
  constructor(
    @InjectModel('TranscriptChunk')
    private readonly chunkModel: Model<TranscriptChunkDocument>,
  ) {}

  async create(dto: CreateTranscriptChunkDto): Promise<TranscriptChunk> {
    // Validate dto fields
    if (
      typeof dto.transcriptId !== 'string' ||
      !(
        dto.startAt instanceof Date ||
        typeof dto.startAt === 'string' ||
        typeof dto.startAt === 'number'
      )
    ) {
      throw new BadRequestException('Invalid input data');
    }

    const overlap = await this.chunkModel.findOne({
      transcriptId: { $eq: dto.transcriptId },
      $or: [
        { startAt: { $lt: dto.startAt } },
        { startAt: { $lte: dto.startAt } },
      ],
    });
    if (overlap !== null) {
      throw new BadRequestException('Time range overlaps with another chunk.');
    }
    return this.chunkModel.create(dto);
  }

  async findAll(transcriptId: string): Promise<TranscriptChunk[]> {
    return this.chunkModel.find({ transcriptId }).sort({ startAt: 1 }).exec();
  }

  async findOne(id: string): Promise<TranscriptChunk> {
    const chunk = await this.chunkModel.findById(id);
    if (chunk === null)
      throw new NotFoundException('Transcript chunk not found');
    return chunk;
  }

  async update(
    id: string,
    dto: UpdateTranscriptChunkDto,
  ): Promise<TranscriptChunk> {
    return sanitizedUpdate(this.chunkModel, id, dto);
  }

  async delete(id: string): Promise<TranscriptChunk> {
    const deleted = await this.chunkModel.findByIdAndDelete(id);
    if (deleted === null)
      throw new NotFoundException('Transcript chunk not found');
    return deleted;
  }

  async deleteByTranscriptId(transcriptId: string): Promise<void> {
    await this.chunkModel.deleteMany({ transcriptId });
  }
}
