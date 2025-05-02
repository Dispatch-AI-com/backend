import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { UpdateUserDto } from './dto/UpdateUser.dto';
import { isValidObjectId } from 'mongoose';
@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>
    ) { }

    async findAll(): Promise<User[]> {
        const users = await this.userModel.find().exec();
        return users
    }

    async findOne(id: string): Promise<User> {
        if (!isValidObjectId(id)) {
            throw new BadRequestException(`Invalid user id: ${id}`);
          }
        const user = await this.userModel.findById(id).exec();
        if (!user) throw new NotFoundException(`User with id ${id} not found`);
        return user;
    }

    async patch(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true }).exec();
        if (!user) throw new NotFoundException(`User with id ${id} not found`);
        return user;
    }

    async delete(id: string): Promise<User> {
        const deleted = await this.userModel.findByIdAndDelete(id).exec();
        if (!deleted) throw new NotFoundException(`User with id ${id} not found`);
        return deleted;
    }
}
