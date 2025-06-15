import { CallLogStatus } from '../../src/common/constants/calllog.constant';
import { randomBytes } from 'crypto';

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function createMockCallLogDto(overrides: Partial<any> = {}) {
  const startAt = randomDate(new Date('2025-01-01T00:00:00Z'), new Date('2025-01-10T23:59:59Z'));
  const endAt = new Date(startAt.getTime() + 10 * 60 * 1000); 

  return {
    userId: 'user-' + randomBytes(2).readUInt16BE(0) % 1000,
    serviceBookedId: 'booking-' + randomBytes(2).readUInt16BE(0) % 1000,
    callerNumber: '+6140000' + (randomBytes(2).readUInt16BE(0) % 10000).toString().padStart(4, '0'),
    callerName: 'User ' + randomBytes(2).readUInt16BE(0) % 1000,
    status: CallLogStatus.InProgress,
    startAt,
    endAt,
    ...overrides,
  };
}