import { Expose, Transform } from 'class-transformer';

import { EUserRole } from '@/common/constants/user.constant';
import { UserStatus } from '@/modules/user/enum/userStatus.enum';

export class UserResponseDto {
  @Expose()
  @Transform(({ value }) => {
    if (value != null) {
      return String(value);
    }
    return undefined;
  })
  _id!: string;

  @Expose()
  email!: string;

  @Expose()
  firstName?: string;

  @Expose()
  lastName?: string;

  @Expose()
  role!: EUserRole;

  @Expose()
  status!: UserStatus;
}
