import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ITranscriptChunk } from '@/common/interfaces/transcript-chunk';

import { Transcript } from '../transcript/schema/transcript.schema';
import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { QueryTranscriptChunkDto } from './dto/query-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';
import { TranscriptChunk } from './schema/transcript-chunk.schema';
import {
  sanitizedUpdate,
  sanitizeTranscriptChunkUpdate,
} from './utils/sanitized-update';

interface TranscriptChunkFilter {
  transcriptId: Types.ObjectId;
  speakerType?: { $eq: 'AI' | 'User' };
  startAt?: { $gte: number };
}

@Injectable()
export class TranscriptChunkService {
  constructor(
    @InjectModel(TranscriptChunk.name)
    private readonly transcriptChunkModel: Model<TranscriptChunk>,
    @InjectModel(Transcript.name)
    private readonly transcriptModel: Model<Transcript>,
  ) {}

  async create(
    transcriptId: string,
    dto: CreateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    if (!Types.ObjectId.isValid(transcriptId)) {
      throw new BadRequestException('Invalid transcript ID');
    }

    const transcript = await this.transcriptModel.findById(transcriptId);
    if (!transcript) {
      throw new NotFoundException(
        `Transcript with ID ${transcriptId} not found`,
      );
    }

    const overlap = await this.transcriptChunkModel.findOne({
      transcriptId: new Types.ObjectId(transcriptId),
      startAt: dto.startAt,
    });
    if (overlap) {
      throw new BadRequestException(
        'A chunk with the same start time already exists.',
      );
    }

    const chunk = await this.transcriptChunkModel.create(
      Object.assign({}, dto, {
        transcriptId: new Types.ObjectId(transcriptId),
      }),
    );
    return this.convertToITranscriptChunk(chunk);
  }

  async findAll(
    transcriptId: string,
    query: QueryTranscriptChunkDto,
  ): Promise<ITranscriptChunk[]> {
    if (!Types.ObjectId.isValid(transcriptId)) {
      throw new BadRequestException('Invalid transcript ID');
    }

    const transcript = await this.transcriptModel.findById(transcriptId);
    if (!transcript) {
      throw new NotFoundException(
        `Transcript with ID ${transcriptId} not found`,
      );
    }

    const { speakerType, startAt, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: TranscriptChunkFilter = {
      transcriptId: new Types.ObjectId(transcriptId),
    };

    // Validate and sanitize speakerType
    if (speakerType && ['AI', 'User'].includes(speakerType)) {
      filter.speakerType = { $eq: speakerType };
    }

    // Validate and sanitize startAt
    if (startAt !== undefined && typeof startAt === 'number') {
      filter.startAt = { $gte: startAt };
    }

    const chunks = await this.transcriptChunkModel
      .find(filter)
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return chunks.map(chunk => this.convertToITranscriptChunk(chunk));
  }

  async findAllChunks(): Promise<ITranscriptChunk[]> {
    const chunks = await this.transcriptChunkModel.find().exec();
    return chunks.map(chunk => this.convertToITranscriptChunk(chunk));
  }

  async findOne(
    transcriptId: string,
    chunkId: string,
  ): Promise<ITranscriptChunk> {
    if (
      !Types.ObjectId.isValid(transcriptId) ||
      !Types.ObjectId.isValid(chunkId)
    ) {
      throw new BadRequestException('Invalid ID');
    }

    const transcript = await this.transcriptModel.findById(transcriptId);
    if (!transcript) {
      throw new NotFoundException(
        `Transcript with ID ${transcriptId} not found`,
      );
    }

    const chunk = await this.transcriptChunkModel.findOne({
      _id: new Types.ObjectId(chunkId),
      transcriptId: new Types.ObjectId(transcriptId),
    });

    if (!chunk) {
      throw new NotFoundException(`Chunk with ID ${chunkId} not found`);
    }

    return this.convertToITranscriptChunk(chunk);
  }

  async update(
    id: string,
    dto: UpdateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    const doc = await this.transcriptChunkModel.findById(id);
    if (!doc) {
      throw new NotFoundException(`Chunk with ID ${id} not found`);
    }
    const sanitized = sanitizeTranscriptChunkUpdate(dto);
    const updated = await sanitizedUpdate(doc, sanitized);
    return this.convertToITranscriptChunk(updated);
  }

  async delete(id: string): Promise<ITranscriptChunk> {
    const deleted = await this.transcriptChunkModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Transcript chunk not found');
    return this.convertToITranscriptChunk(deleted);
  }

  async deleteByTranscriptId(transcriptId: string): Promise<void> {
    await this.transcriptChunkModel.deleteMany({ transcriptId });
  }

  async createMany(
    transcriptId: string,
    createDtos: CreateTranscriptChunkDto[],
  ): Promise<ITranscriptChunk[]> {
    if (!Types.ObjectId.isValid(transcriptId)) {
      throw new BadRequestException('Invalid transcript ID');
    }

    const transcript = await this.transcriptModel.findById(transcriptId);
    if (!transcript) {
      throw new NotFoundException(
        `Transcript with ID ${transcriptId} not found`,
      );
    }

    // Check for duplicate startAt values
    const startTimes = createDtos.map(dto => dto.startAt);
    const uniqueStartTimes = new Set(startTimes);
    if (startTimes.length !== uniqueStartTimes.size) {
      throw new BadRequestException('Duplicate start times are not allowed');
    }

    // Check for existing chunks with the same startAt
    const existingChunks = await this.transcriptChunkModel.find({
      transcriptId: new Types.ObjectId(transcriptId),
      startAt: { $in: startTimes },
    });
    if (existingChunks.length > 0) {
      throw new BadRequestException(
        'Some chunks with the same start times already exist',
      );
    }

    const chunks = await this.transcriptChunkModel.insertMany(
      createDtos.map(dto => ({
        transcriptId: new Types.ObjectId(transcriptId),
        speakerType: dto.speakerType,
        text: dto.text,
        startAt: dto.startAt,
      })),
    );

    return chunks.map(chunk => this.convertToITranscriptChunk(chunk));
  }

  private convertToITranscriptChunk(doc: TranscriptChunk): ITranscriptChunk {
    const obj = doc.toObject();
    return {
      _id: obj._id.toString(),
      transcriptId: obj.transcriptId.toString(),
      speakerType: obj.speakerType,
      text: obj.text,
      startAt: obj.startAt,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}
