import { CallLogStatus } from '../../src/common/constants/calllog.constant';

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function createMockCallLogDto(overrides: Partial<any> = {}) {
  const startAt = randomDate(new Date('2025-01-01T00:00:00Z'), new Date('2025-01-10T23:59:59Z'));
  const endAt = new Date(startAt.getTime() + 10 * 60 * 1000); 

  return {
    userId: 'user-' + Math.floor(Math.random() * 1000),
    serviceBookedId: 'booking-' + Math.floor(Math.random() * 1000),
    callerNumber: '+6140000' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
    status: CallLogStatus.InProgress,
    startAt,
    endAt,
    ...overrides,
  };
}