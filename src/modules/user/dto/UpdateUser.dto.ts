//src/modules/user/dto/UpdateUser.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
