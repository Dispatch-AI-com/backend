import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { UpdateUserDto } from './dto/UpdateUser.dto';

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
        const user = await this.userModel.findById(id).exec();
        if (!user) throw new NotFoundException(`User with id ${id} not found`);
        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const updated = await this.userModel
            .findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true })
            .exec();
        if (!updated) throw new NotFoundException(`User with id ${id} not found`);
        return updated;
    }

    async patch(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const patch = await this.update(id, updateUserDto as UpdateUserDto);
        if (!patch) throw new NotFoundException(`User with id ${id} not found`);
        return patch;
    }

    async delete(id: string): Promise<User> {
        const deleted = await this.userModel.findByIdAndDelete(id).exec();
        if (!deleted) throw new NotFoundException(`User with id ${id} not found`);
        return deleted;
    }
}
