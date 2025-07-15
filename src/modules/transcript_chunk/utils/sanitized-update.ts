import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';

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
  if (existing === null)
    throw new NotFoundException('Transcript chunk not found');

  // Only allow updating specific fields
  const sanitizedData: Partial<UpdateTranscriptChunkDto> = {};
  if (typeof dto.text === 'string') sanitizedData.text = dto.text;
  if (dto.speakerType === 'AI' || dto.speakerType === 'User')
    sanitizedData.speakerType = dto.speakerType;
  if (
    dto.startAt instanceof Date ||
    typeof dto.startAt === 'string' ||
    typeof dto.startAt === 'number'
  )
    sanitizedData.startAt = dto.startAt;
  const updated = await chunkModel.findByIdAndUpdate(id, sanitizedData, {
    new: true,
  });
  if (updated === null)
    throw new NotFoundException('Transcript chunk not found');
  return updated;
}
