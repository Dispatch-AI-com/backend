import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateTranscriptDto, UpdateTranscriptDto } from './dto';
import { Transcript } from './schema/transcript.schema';

@Injectable()
export class TranscriptService {
  constructor(
    @InjectModel(Transcript.name)
    private readonly transcriptModel: Model<Transcript>,
  ) {}

  async create(dto: CreateTranscriptDto): Promise<Transcript> {
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
    const existing = await this.transcriptModel.findById(id);
    if (!existing) throw new NotFoundException('Transcript not found');

    // Only update summary field, preserve calllogid
    const sanitizedData = {
      summary: dto.summary || existing.summary,
    };

    const updated = await this.transcriptModel.findByIdAndUpdate(
      id,
      sanitizedData,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Transcript not found');
    return updated;
  }

  async delete(id: string): Promise<Transcript> {
    const deleted = await this.transcriptModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Transcript not found');
    return deleted;
  }
}
