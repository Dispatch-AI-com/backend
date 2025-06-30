export interface Message {
  speaker: 'AI' | 'customer';
  message: string;
  startedAt: string;
}

export interface Service {
  id: string;
  name: string;
  price: number | null;
  description?: string;
}

export interface UserInfo {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  calendar_access_token: string;
  description?: string;
}

export interface CallSkeleton {
  callSid: string;
  services: readonly Service[];
  company: Company;
  user: {
    service?: Service;
    serviceBookedTime?: string;
    userInfo: Partial<UserInfo>;
  };
  history: Message[];
  confirmBooking: boolean;
  confirmEmailSent: boolean;
}
