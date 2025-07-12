import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './schema/task.schema';
import { TaskService } from './task.service';

@ApiTags('Task')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiCreatedResponse({ type: Task, description: 'Task created' })
  async create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  @ApiOkResponse({ type: [Task], description: 'List of tasks for user' })
  async findAllByUser(@Query('userId') userId: string): Promise<Task[]> {
    if (typeof userId !== 'string') {
      throw new BadRequestException('Invalid userId');
    }
    return this.taskService.findAllByUser(userId);
  }

  @Patch(':id')
  @ApiOkResponse({ type: Task, description: 'Updated task' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOkResponse({
    schema: { example: { message: 'Task deleted successfully' } },
    description: 'Task deleted',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.taskService.remove(id);
    return { message: 'Task deleted successfully' };
  }
}
