import { Types } from 'mongoose';

import type { ISanitizedUpdate } from '@/common/interfaces/transcript-chunk';

import type { UpdateTranscriptChunkDto } from '../dto/update-transcript-chunk.dto';
import type { TranscriptChunkDocument } from '../schema/transcript-chunk.schema';

export function sanitizeTranscriptChunkUpdate(
  dto: UpdateTranscriptChunkDto,
  transcriptId?: string,
): ISanitizedUpdate {
  const update: ISanitizedUpdate = {};

  if (dto.speakerType !== undefined) {
    const validTypes = ['AI', 'User'] as const;
    if (!validTypes.includes(dto.speakerType)) {
      throw new Error(`Invalid speaker type: ${dto.speakerType}`);
    }
    update.speakerType = dto.speakerType;
  }

  if (dto.text !== undefined) {
    update.text = dto.text;
  }

  if (dto.startAt !== undefined) {
    if (typeof dto.startAt !== 'number' || dto.startAt < 0) {
      throw new Error('Start time must be a non-negative number');
    }
    update.startAt = dto.startAt;
  }

  if (dto.endAt !== undefined) {
    if (typeof dto.endAt !== 'number' || dto.endAt < 0) {
      throw new Error('End time must be a non-negative number');
    }
    update.endAt = dto.endAt;
  }

  if (transcriptId !== undefined && transcriptId !== '') {
    if (!Types.ObjectId.isValid(transcriptId)) {
      throw new Error('Invalid transcript ID');
    }
    update.transcriptId = new Types.ObjectId(transcriptId);
  }

  return update;
}

export async function sanitizedUpdate<T extends TranscriptChunkDocument>(
  doc: T,
  update: Partial<T>,
): Promise<T> {
  Object.assign(doc, update);
  return doc.save();
}
