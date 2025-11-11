import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Body,
  Post,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

import { EUserRole } from '@/common/constants/user.constant';
import { SALT_ROUNDS } from '@/modules/auth/auth.config';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CreateUserDto } from '@/modules/auth/dto/signup.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) return;

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await user.save();

    // TODO: Send email with reset link (for now, just log it)
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    console.log('Password reset link:', resetLink);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const { token, password, confirmPassword } = dto;

    if (!token || !password || !confirmPassword) {
      throw new BadRequestException('Missing required fields');
    }
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    // TODO: Find user by reset token, check expiry.
    const user = await this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // TODO: Hash password and update user
    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }
}
