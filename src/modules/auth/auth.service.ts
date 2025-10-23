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
import { generateCSRFToken } from '@/utils/csrf.util';
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
    const isPasswordValid = await bcrypt.compare(password, user.password ?? '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    return user.toObject() as User;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: User; token: string; csrfToken: string }> {
    const foundUser = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');
    if (!foundUser) {
      throw new UnauthorizedException('Username or Password Not Match');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      foundUser.password ?? '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username or Password Not Match');
    }
    const user = foundUser.toObject({ virtuals: false });
    const token = this.jwtService.sign({
      sub: user._id?.toString() ?? user._id, // Ensure ObjectId is converted to string
      email: user.email,
      role: user.role,
      status: user.status,
    });
    const csrfToken = generateCSRFToken();
    return { user, token, csrfToken };
  }

  async createUser(
    userData: CreateUserDto,
  ): Promise<{ user: User; token: string; csrfToken: string }> {
    if (await this.checkUserExists(userData.email)) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    const secureUserData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      role: userData.role ?? EUserRole.user,
      ...(userData.position != null &&
        userData.position.trim() !== '' && { position: userData.position }),
      ...(userData.address != null && { address: userData.address }),
    };

    const newUser = new this.userModel(secureUserData);
    await newUser.save();

    const token = this.jwtService.sign({
      sub: newUser._id?.toString() ?? newUser._id, // Ensure ObjectId is converted to string
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
    });
    const csrfToken = generateCSRFToken();
    return { user: newUser.toObject() as User, token, csrfToken };
  }

  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email });
    return !!user;
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await this.userModel.findById(userId).exec();
    return user ? (user.toObject() as User) : null;
  }
}
