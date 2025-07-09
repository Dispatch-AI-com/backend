import type { CallSkeleton } from '@/modules/telephony/types/redis-session';

export function createEmptySkeleton(callSid: string): CallSkeleton {
  return {
    callSid,
    services: [],
    company: { id: '', name: '', email: '', calendar_access_token: '' },
    user: {
      service: undefined,
      serviceBookedTime: undefined,
      userInfo: {
        email: '',
        name: '',
        phone: '',
        address: '',
      },
    },
    history: [],
    confirmBooking: false,
    confirmEmailSent: false,
  };
}
