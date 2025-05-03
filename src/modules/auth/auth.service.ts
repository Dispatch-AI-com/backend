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
    return user;
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
    return foundUser;
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    if (await this.checkUserExists(userData.email)) {
      throw new ConflictException('User already exists');
    }

    const saltRounds = SALT_ROUNDS;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const { name, email, role } = userData;

    const secureUserData = {
      name,
      email,
      role: role ?? EUserRole.USER,
      password: hashedPassword,
    };

    const newUser = new this.userModel(secureUserData);
    await newUser.save();
    return newUser;
  }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email });
    return !!user;
  }
}
