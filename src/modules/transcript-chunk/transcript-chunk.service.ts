import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';
import {
  TranscriptChunk,
  TranscriptChunkDocument,
} from './schema/transcript-chunk.schema';
import { sanitizedUpdate } from './utils/sanitized-update';
import { ITranscriptChunk } from '@/common/interfaces/transcript-chunk';
import { Transcript } from '../transcript/schema/transcript.schema';
import { QueryTranscriptChunkDto } from './dto/query-transcript-chunk.dto';

@Injectable()
export class TranscriptChunkService {
  constructor(
    @InjectModel(TranscriptChunk.name)
    private readonly transcriptChunkModel: Model<TranscriptChunk>,
    @InjectModel(Transcript.name)
    private readonly transcriptModel: Model<Transcript>,
  ) {}

  async create(transcriptId: string, dto: CreateTranscriptChunkDto): Promise<ITranscriptChunk> {
    if (!Types.ObjectId.isValid(transcriptId)) {
      throw new BadRequestException('Invalid transcript ID');
    }

    const transcript = await this.transcriptModel.findById(transcriptId);
    if (!transcript) {
      throw new NotFoundException(`Transcript with ID ${transcriptId} not found`);
    }

    const overlap = await this.transcriptChunkModel.findOne({
      transcriptId: new Types.ObjectId(transcriptId),
      $or: [
        { startAt: { $lt: dto.endAt, $gte: dto.startAt } },
        { endAt: { $gt: dto.startAt, $lte: dto.endAt } },
        { startAt: { $lte: dto.startAt }, endAt: { $gte: dto.endAt } },
      ],
    });
    if (overlap) {
      throw new BadRequestException('Time range overlaps with another chunk.');
    }

    const chunk = await this.transcriptChunkModel.create({
      transcriptId: new Types.ObjectId(transcriptId),
      ...dto,
    });
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
      throw new NotFoundException(`Transcript with ID ${transcriptId} not found`);
    }

    const { speakerType, startAt, endAt, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: any = { transcriptId: new Types.ObjectId(transcriptId) };
    if (speakerType) {
      filter.speakerType = speakerType;
    }
    if (startAt !== undefined) {
      filter.startAt = { $gte: startAt };
    }
    if (endAt !== undefined) {
      filter.endAt = { $lte: endAt };
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
    if (!Types.ObjectId.isValid(transcriptId) || !Types.ObjectId.isValid(chunkId)) {
      throw new BadRequestException('Invalid ID');
    }

    const transcript = await this.transcriptModel.findById(transcriptId);
    if (!transcript) {
      throw new NotFoundException(`Transcript with ID ${transcriptId} not found`);
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
    const updated = await sanitizedUpdate(this.transcriptChunkModel, id, dto);
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
      throw new NotFoundException(`Transcript with ID ${transcriptId} not found`);
    }

    // Overlap check for each chunk
    for (const dto of createDtos) {
      const overlap = await this.transcriptChunkModel.findOne({
        transcriptId: new Types.ObjectId(transcriptId),
        $or: [
          { startAt: { $lt: dto.endAt, $gte: dto.startAt } },
          { endAt: { $gt: dto.startAt, $lte: dto.endAt } },
          { startAt: { $lte: dto.startAt }, endAt: { $gte: dto.endAt } },
        ],
      });
      if (overlap) {
        throw new BadRequestException('Time range overlaps with another chunk.');
      }
    }

    const chunks = await this.transcriptChunkModel.insertMany(
      createDtos.map(dto => ({
        transcriptId: new Types.ObjectId(transcriptId),
        speakerType: dto.speakerType,
        text: dto.text,
        startAt: dto.startAt,
        endAt: dto.endAt,
      })),
    );

    return chunks.map(chunk => this.convertToITranscriptChunk(chunk));
  }

  private convertToITranscriptChunk(doc: TranscriptChunk): ITranscriptChunk {
    const obj = doc.toObject();
    return {
      _id: obj._id,
      transcriptId: obj.transcriptId,
      speakerType: obj.speakerType,
      text: obj.text,
      startAt: obj.startAt,
      endAt: obj.endAt,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}
