import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '@/modules/user/schema/user.schema';
import { SALT_ROUNDS } from '@/modules/auth/auth.config';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { EUserRole } from '@/common/constants/user.constant';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    return user.toObject() as User;
  }

  async login(loginDto: LoginDto): Promise<User> {
    const foundUser = await this.userModel.findOne({ email: loginDto.email });
    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, foundUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    return foundUser.toObject() as User;
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    if (await this.checkUserExists(userData.email)) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const secureUserData = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role ?? EUserRole.USER,
    };

    const newUser = new this.userModel(secureUserData);
    await newUser.save();

    return newUser.toObject() as User;
  }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email });
    return !!user;
  }
}
