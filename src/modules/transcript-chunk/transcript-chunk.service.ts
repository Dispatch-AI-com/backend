import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ITranscriptChunk } from '@/common/interfaces/transcript';

import { Transcript } from '../transcript/schema/transcript.schema';
import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { QueryTranscriptChunkDto } from './dto/query-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';
import {
  TranscriptChunk,
  TranscriptChunkDocument,
} from './schema/transcript-chunk.schema';

interface TranscriptChunkFilter {
  transcriptId: Types.ObjectId;
  speakerType?: { $eq: 'AI' | 'User' };
  startAt?: { $gte: number };
}

@Injectable()
export class TranscriptChunkService {
  constructor(
    @InjectModel('TranscriptChunk')
    private readonly transcriptChunkModel: Model<TranscriptChunk>,
    @InjectModel('Transcript')
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
        `Chunk with start time ${dto.startAt.toString()} already exists`,
      );
    }

    const chunk = await this.transcriptChunkModel.create({
      transcriptId: new Types.ObjectId(transcriptId),
      speakerType: dto.speakerType,
      text: dto.text,
      startAt: dto.startAt,
    });

    return this.convertToITranscriptChunk(chunk);
  }

  async findAll(
    transcriptId: string,
    query: QueryTranscriptChunkDto,
  ): Promise<{
    data: ITranscriptChunk[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    if (!Types.ObjectId.isValid(transcriptId)) {
      throw new BadRequestException('Invalid transcript ID');
    }

    // Check if transcript exists
    const transcript = await this.transcriptModel.findById(transcriptId);
    if (!transcript) {
      throw new NotFoundException(
        `Transcript with ID ${transcriptId} not found`,
      );
    }

    const filter: TranscriptChunkFilter = {
      transcriptId: new Types.ObjectId(transcriptId),
    };

    if (query.speakerType) {
      filter.speakerType = { $eq: query.speakerType };
    }

    if (query.startAt !== undefined) {
      filter.startAt = { $gte: query.startAt };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20; // Changed to default 20 items
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.transcriptChunkModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const chunks = await this.transcriptChunkModel
      .find(filter)
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: chunks.map(chunk => this.convertToITranscriptChunk(chunk)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(transcriptId: string, id: string): Promise<ITranscriptChunk> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chunk ID');
    }

    if (!Types.ObjectId.isValid(transcriptId)) {
      throw new BadRequestException('Invalid transcript ID');
    }

    const chunk = await this.transcriptChunkModel.findOne({
      _id: id,
      transcriptId: new Types.ObjectId(transcriptId),
    });

    if (!chunk) {
      throw new NotFoundException(`Transcript chunk with ID ${id} not found`);
    }

    return this.convertToITranscriptChunk(chunk);
  }

  async update(
    id: string,
    dto: UpdateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chunk ID');
    }

    const updateData: Partial<{
      speakerType: 'AI' | 'User';
      text: string;
      startAt: number;
    }> = {};

    if (dto.speakerType !== undefined) {
      updateData.speakerType = dto.speakerType;
    }

    if (dto.text !== undefined) {
      updateData.text = dto.text;
    }

    if (dto.startAt !== undefined) {
      // Check for conflicts with existing chunks
      const existing = await this.transcriptChunkModel.findById(id);
      if (!existing) {
        throw new NotFoundException(`Transcript chunk with ID ${id} not found`);
      }

      if (dto.startAt !== existing.startAt) {
        const overlap = await this.transcriptChunkModel.findOne({
          _id: { $ne: id },
          transcriptId: existing.transcriptId,
          startAt: dto.startAt,
        });

        if (overlap) {
          throw new BadRequestException(
            `Chunk with start time ${dto.startAt.toString()} already exists`,
          );
        }
      }

      updateData.startAt = dto.startAt;
    }

    const updated = await this.transcriptChunkModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new NotFoundException(`Transcript chunk with ID ${id} not found`);
    }

    return this.convertToITranscriptChunk(updated);
  }

  async delete(id: string): Promise<ITranscriptChunk> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid chunk ID');
    }

    const deleted = await this.transcriptChunkModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Transcript chunk with ID ${id} not found`);
    }

    return this.convertToITranscriptChunk(deleted);
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

    // Check for duplicates within the request
    const startTimes = createDtos.map(dto => dto.startAt);
    const uniqueStartTimes = new Set(startTimes);
    if (uniqueStartTimes.size !== startTimes.length) {
      throw new BadRequestException('Duplicate start times are not allowed');
    }

    // Check for overlaps with existing chunks
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

    return chunks.map(chunk =>
      this.convertToITranscriptChunk(chunk as TranscriptChunkDocument),
    );
  }

  async deleteByTranscriptId(transcriptId: string): Promise<void> {
    if (!Types.ObjectId.isValid(transcriptId)) {
      throw new BadRequestException('Invalid transcript ID');
    }

    await this.transcriptChunkModel.deleteMany({
      transcriptId: new Types.ObjectId(transcriptId),
    });
  }

  private convertToITranscriptChunk(
    doc: TranscriptChunkDocument,
  ): ITranscriptChunk {
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
