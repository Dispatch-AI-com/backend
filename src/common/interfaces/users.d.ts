import { EUserRole } from '@/common/constants/user.constant';
import { IResponseBase } from '@/common/interfaces/res.d';
export interface IUser {
  name: string;
  email: string;
  role: EUserRole;
}

export interface IUserResponse extends IResponseBase {
  data: IUser;
}
