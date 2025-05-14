import { UpdateCallLogDto } from '../dto/update-calllog.dto';

export function sanitizeCallLogUpdate(updateDto: UpdateCallLogDto): Partial<UpdateCallLogDto> {
  const sanitizedUpdate: Partial<UpdateCallLogDto> = {};

  // Only include fields that are defined in the update DTO
  if (updateDto.serviceBookedId !== undefined) {
    sanitizedUpdate.serviceBookedId = updateDto.serviceBookedId;
  }
  if (updateDto.callerNumber !== undefined) {
    sanitizedUpdate.callerNumber = updateDto.callerNumber;
  }
  if (updateDto.status !== undefined) {
    sanitizedUpdate.status = updateDto.status;
  }
  if (updateDto.startAt !== undefined) {
    sanitizedUpdate.startAt = updateDto.startAt;
  }
  if (updateDto.endAt !== undefined) {
    sanitizedUpdate.endAt = updateDto.endAt;
  }
  if (updateDto.recordingUrl !== undefined) {
    sanitizedUpdate.recordingUrl = updateDto.recordingUrl;
  }

  return sanitizedUpdate;
} 