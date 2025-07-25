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
  address?: Partial<Address>;
}

export interface Address {
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  userId: string;
  calendar_access_token?: string;
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
  servicebooked: boolean;
  confirmEmailsent: boolean;
  createdAt?: string;
}
