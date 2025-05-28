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
import { ITranscriptChunk } from '@/common/interfaces/transcript_chuck';

@Injectable()
export class TranscriptChunkService {
  constructor(
    @InjectModel(TranscriptChunk.name)
    private readonly chunkModel: Model<TranscriptChunkDocument>,
  ) {}

  async create(dto: CreateTranscriptChunkDto): Promise<ITranscriptChunk> {
    // Validate dto fields
    if (
      typeof dto.transcriptId !== 'string' ||
      !(
        dto.startAt instanceof Date ||
        typeof dto.startAt === 'string' ||
        typeof dto.startAt === 'number'
      ) ||
      !(
        dto.endAt instanceof Date ||
        typeof dto.endAt === 'string' ||
        typeof dto.endAt === 'number'
      )
    ) {
      throw new BadRequestException('Invalid input data');
    }

    const overlap = await this.chunkModel.findOne({
      transcriptId: { $eq: dto.transcriptId },
      $or: [
        { startAt: { $lt: dto.endAt, $gte: dto.startAt } },
        { endAt: { $gt: dto.startAt, $lte: dto.endAt } },
        { startAt: { $lte: dto.startAt }, endAt: { $gte: dto.endAt } },
      ],
    });
    if (overlap) {
      throw new BadRequestException('Time range overlaps with another chunk.');
    }
    return this.chunkModel.create(dto);
  }

  async findAll(transcriptId: string): Promise<ITranscriptChunk[]> {
    return this.chunkModel.find({ transcriptId }).sort({ startAt: 1 }).exec();
  }

  async findAllChunks(): Promise<ITranscriptChunk[]> {
    return this.chunkModel.find().exec();
  }

  async findOne(id: string): Promise<ITranscriptChunk> {
    const chunk = await this.chunkModel.findById(id);
    if (!chunk) throw new NotFoundException('Transcript chunk not found');
    return chunk;
  }

  async update(
    id: string,
    dto: UpdateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    return sanitizedUpdate(this.chunkModel, id, dto);
  }

  async delete(id: string): Promise<ITranscriptChunk> {
    const deleted = await this.chunkModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Transcript chunk not found');
    return deleted;
  }

  async deleteByTranscriptId(transcriptId: string): Promise<void> {
    await this.chunkModel.deleteMany({ transcriptId });
  }
}
