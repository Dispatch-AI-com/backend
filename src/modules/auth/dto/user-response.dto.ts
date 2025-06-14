import { Expose } from 'class-transformer';

import { EUserRole } from '@/common/constants/user.constant';

export class UserResponseDto {
  @Expose()
  _id!: string;

  @Expose()
  email!: string;

  @Expose()
  firstName?: string;

  @Expose()
  lastName?: string;

  @Expose()
  role!: EUserRole;
}
