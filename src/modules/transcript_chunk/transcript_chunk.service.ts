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

@Injectable()
export class TranscriptChunkService {
  constructor(
    @InjectModel(TranscriptChunk.name)
    private readonly chunkModel: Model<TranscriptChunkDocument>,
  ) {}

  async create(dto: CreateTranscriptChunkDto): Promise<TranscriptChunk> {
    // 检查时间段重叠
    const overlap = await this.chunkModel.findOne({
      transcriptId: dto.transcriptId,
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

  async findAll(transcriptId: string): Promise<TranscriptChunk[]> {
    return this.chunkModel.find({ transcriptId }).sort({ startAt: 1 }).exec();
  }

  async findOne(id: string): Promise<TranscriptChunk> {
    const chunk = await this.chunkModel.findById(id);
    if (!chunk) throw new NotFoundException('Transcript chunk not found');
    return chunk;
  }

  async update(
    id: string,
    dto: UpdateTranscriptChunkDto,
  ): Promise<TranscriptChunk> {
    const updated = await this.chunkModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException('Transcript chunk not found');
    return updated;
  }

  async delete(id: string): Promise<TranscriptChunk> {
    const deleted = await this.chunkModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Transcript chunk not found');
    return deleted;
  }

  async deleteByTranscriptId(transcriptId: string): Promise<void> {
    await this.chunkModel.deleteMany({ transcriptId });
  }
}
