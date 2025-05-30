import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';

import type { UpdateTranscriptChunkDto } from '../dto/update-transcript-chunk.dto';
import type { TranscriptChunkDocument } from '../schema/transcript-chunk.schema';

export async function sanitizedUpdate<T extends TranscriptChunkDocument>(
  model: Model<T>,
  id: string,
  dto: UpdateTranscriptChunkDto,
): Promise<T> {
  // Validate id
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid chunk id');
  }

  const existing = await model.findById(id);
  if (!existing) throw new NotFoundException('Transcript chunk not found');

  const sanitizedData: Partial<UpdateTranscriptChunkDto> = {};

  if (dto.speakerType !== undefined) {
    sanitizedData.speakerType = dto.speakerType;
  }

  if (dto.text !== undefined) {
    sanitizedData.text = dto.text;
  }

  if (dto.startAt !== undefined) {
    if (typeof dto.startAt !== 'number') {
      throw new BadRequestException('startAt must be a number');
    }
    sanitizedData.startAt = dto.startAt;
  }

  if (dto.endAt !== undefined) {
    if (typeof dto.endAt !== 'number') {
      throw new BadRequestException('endAt must be a number');
    }
    sanitizedData.endAt = dto.endAt;
  }

  const updated = await model.findByIdAndUpdate(id, sanitizedData, {
    new: true,
  });

  if (!updated) {
    throw new BadRequestException('Document not found');
  }

  return updated;
}
