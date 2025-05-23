import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types, Model } from 'mongoose';

import type { UpdateTranscriptChunkDto } from '../dto/update-transcript-chunk.dto';
import type { TranscriptChunkDocument } from '../schema/transcript_chunk.schema';

export async function sanitizedUpdate(
  chunkModel: Model<TranscriptChunkDocument>,
  id: string,
  dto: UpdateTranscriptChunkDto,
): Promise<TranscriptChunkDocument> {
  // Validate id
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid chunk id');
  }

  const existing = await chunkModel.findById(id);
  if (!existing) throw new NotFoundException('Transcript chunk not found');

  // Only allow updating specific fields
  const sanitizedData: Partial<UpdateTranscriptChunkDto> = {};
  if (dto.text !== undefined) sanitizedData.text = dto.text;
  if (dto.speakerType !== undefined)
    sanitizedData.speakerType = dto.speakerType;
  if (dto.startAt !== undefined) sanitizedData.startAt = dto.startAt;
  if (dto.endAt !== undefined) sanitizedData.endAt = dto.endAt;

  const updated = await chunkModel.findByIdAndUpdate(id, sanitizedData, {
    new: true,
  });
  if (!updated) throw new NotFoundException('Transcript chunk not found');
  return updated;
}
