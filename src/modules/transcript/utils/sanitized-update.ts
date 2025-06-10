import { NotFoundException } from '@nestjs/common';
import type { Model } from 'mongoose';

import type { UpdateTranscriptDto } from '../dto';
import type { Transcript } from '../schema/transcript.schema';

export async function sanitizedUpdate(
  transcriptModel: Model<Transcript>,
  id: string,
  dto: UpdateTranscriptDto,
): Promise<Transcript> {
  const existing = await transcriptModel.findById(id);
  if (!existing) throw new NotFoundException('Transcript not found');

  // Update summary and keyPoints, preserve calllogid
  const sanitizedData: Partial<Transcript> = {
    summary:
      typeof dto.summary === 'string' && dto.summary.trim() !== ''
        ? dto.summary.trim()
        : existing.summary,
  };

  if (dto.keyPoints !== undefined) {
    sanitizedData.keyPoints = dto.keyPoints;
  }

  const updated = await transcriptModel.findByIdAndUpdate(id, sanitizedData, {
    new: true,
  });
  if (!updated) throw new NotFoundException('Transcript not found');
  return updated;
}
