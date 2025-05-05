import type { EUserRole } from '@/common/constants/user.constant';
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: EUserRole;
}
