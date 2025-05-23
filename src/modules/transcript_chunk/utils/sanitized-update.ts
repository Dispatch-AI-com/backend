import { NotFoundException } from '@nestjs/common';
import type { Model } from 'mongoose';
import type { UpdateTranscriptChunkDto } from '../dto/update-transcript-chunk.dto';
import type { TranscriptChunkDocument } from '../schema/transcript_chunk.schema';

export async function sanitizedUpdate(
  chunkModel: Model<TranscriptChunkDocument>,
  id: string,
  dto: UpdateTranscriptChunkDto,
): Promise<TranscriptChunkDocument> {
  const existing = await chunkModel.findById(id);
  if (!existing) throw new NotFoundException('Transcript chunk not found');

  // 只允许更新 text、speakerType、startAt、endAt
  const sanitizedData: Partial<UpdateTranscriptChunkDto> = {};
  if (dto.text !== undefined) sanitizedData.text = dto.text;
  if (dto.speakerType !== undefined) sanitizedData.speakerType = dto.speakerType;
  if (dto.startAt !== undefined) sanitizedData.startAt = dto.startAt;
  if (dto.endAt !== undefined) sanitizedData.endAt = dto.endAt;

  const updated = await chunkModel.findByIdAndUpdate(id, sanitizedData, { new: true });
  if (!updated) throw new NotFoundException('Transcript chunk not found');
  return updated;
}
