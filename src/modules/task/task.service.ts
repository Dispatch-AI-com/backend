import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument } from './schema/task.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskModel.create(createTaskDto);
  }

  async findAllByUser(userId: string): Promise<Task[]> {
    return this.taskModel.find({ userId: { $eq: userId } }).sort({ dateTime: -1 }).exec();
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    // Whitelist allowed fields for updates
    const allowedFields = ['title', 'description', 'status', 'dueDate'];
    const sanitizedUpdate = Object.keys(updateTaskDto)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateTaskDto[key];
        return obj;
      }, {});

    const task = await this.taskModel.findByIdAndUpdate(id, sanitizedUpdate, {
      new: true,
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Task not found');
  }
}
