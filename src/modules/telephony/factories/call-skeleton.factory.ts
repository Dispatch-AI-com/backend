import type { CallSkeleton } from '../types/redis-session';

export function createEmptySkeleton(callSid: string): CallSkeleton {
  return {
    callSid,
    company: {
      id: '',
      name: '',
      email: '',
      userId: '',
    },
    user: {
      userInfo: {
        name: '',
        phone: '',
        address: '',
      },
    },
    history: [],
    intentClassified: false,
    createdAt: new Date().toISOString(),
  };
}
