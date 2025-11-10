export interface Message {
  speaker: 'AI' | 'customer';
  message: string;
  startedAt: string;
}

export interface UserInfo {
  name?: string;
  phone?: string;
  address?: string; // Simplified to single address string
}

export interface Company {
  id: string;
  name: string;
  email: string;
  userId: string;
}

export interface CallSkeleton {
  callSid: string;
  company: Company;
  user: {
    userInfo: Partial<UserInfo>;
  };
  history: Message[];
  intent?: string; // Call intent classification result
  intentClassified: boolean; // Whether intent has been classified
  createdAt?: string;
  callerNumber?: string;
  callStartAt?: string;
}
