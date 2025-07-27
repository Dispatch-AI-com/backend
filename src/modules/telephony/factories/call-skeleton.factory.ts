import type { CallSkeleton } from '@/modules/telephony/types/redis-session';

export function createEmptySkeleton(callSid: string): CallSkeleton {
  return {
    callSid,
    services: [],
    company: {
      id: '',
      name: '',
      email: '',
      userId: '',
      calendar_access_token: '',
    },
    user: {
      service: undefined,
      serviceBookedTime: undefined,
      userInfo: {
        name: '',
        phone: '',
        address: {
          street_number: '',
          street_name: '',
          suburb: '',
          state: '',
          postcode: '',
        },
      },
    },
    history: [],
    servicebooked: false,
    confirmEmailsent: false,
    createdAt: new Date().toISOString(),
  };
}
