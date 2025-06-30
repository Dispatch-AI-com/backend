import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

import { EUserRole } from '@/common/constants/user.constant';
import { SALT_ROUNDS } from '@/modules/auth/auth.config';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { User, UserDocument } from '@/modules/user/schema/user.schema';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    return user.toObject() as User;
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const foundUser = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');
    if (!foundUser) {
      throw new UnauthorizedException('Username or Password Not Match');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      foundUser.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username or Password Not Match');
    }
    const user = foundUser.toObject({ virtuals: false });
    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
    return { user, token };
  }

  async createUser(
    userData: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    if (await this.checkUserExists(userData.email)) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const secureUserData = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role ?? EUserRole.user,
    };

    const newUser = new this.userModel(secureUserData);
    await newUser.save();

    const token = this.jwtService.sign({
      sub: newUser._id,
      email: newUser.email,
      role: newUser.role,
    });
    return { user: newUser.toObject() as User, token };
  }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email });
    return !!user;
  }
}
