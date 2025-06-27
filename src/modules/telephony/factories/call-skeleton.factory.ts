import type { CallSkeleton } from '@/modules/telephony/types/redis-session';

export function createEmptySkeleton(callSid: string): CallSkeleton {
  const now = new Date().toISOString();

  return {
    callSid,
    services: [],
    company: { id: '', name: '' },
    user: {
      service: undefined,
      serviceBookedTime: undefined,
      userInfo: {},
    },
    history: [],
    confirmBooking: false,
    confirmEmailSent: false,
    createdAt: now,
  };
}
