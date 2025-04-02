import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '@/modules/user/schema/user.schema';
import { SALT_ROUNDS } from '@/modules/auth/auth.config';
import { IResponseBase } from '@/common/interfaces/res.d';
import { IUser } from '@/common/interfaces/users.d';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<IResponseBase> {
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            return {
                status: 'error',
                message: 'User not found',
                data: 'Your email has not been registered',
            };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return {
                status: 'error',
                message: 'Invalid password',
                data: 'Your password is incorrect',
            };
        }
        const { password: _, ...result } = user.toObject();
        return {
            status: 'success',
            message: 'Login successful',
            data: result,
        };
    }

    async login(user: UserDocument): Promise<IResponseBase> {
        const payload = { email: user.email, sub: user._id, role: user.role };

        return {
            status: 'success',
            message: 'Login successful',
            data: {
                user,
                access_token: this.jwtService.sign(payload),
            },
        };
    }

    async createUser(userData: IUser): Promise<IResponseBase> {
        if (await this.checkUserExists(userData.email)) {
            return {
                status: 'error',
                message: 'User already exists',
                data: null,
            };
        }
        
        const saltRounds = SALT_ROUNDS;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        const secureUserData = {
            ...userData,
            password: hashedPassword
        };

        const newUser = new this.userModel(secureUserData);
        await newUser.save();
        return {
            status: 'success',
            message: 'User created successfully',
            data: newUser,
        };
    }

    async checkUserExists(email: string): Promise<boolean> {
        const user = await this.userModel.findOne({ email });
        return !!user;
    }
}