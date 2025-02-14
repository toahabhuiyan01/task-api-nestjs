import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Types } from 'mongoose';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  @HttpCode(200)
  async findAll(@Request() req) {
    return this.tasksService.findAll(req.user.userId);
  }

  @Get(':id')
  @HttpCode(200)
  async findOne(@Request() req, @Param('id') id: string) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Post()
  @HttpCode(201)
  async create(
    @Request() req,
    @Body()
    createTaskDto: { title: string; description: string; dueDate: string },
  ) {
    if (
      !createTaskDto.title ||
      !createTaskDto.description ||
      !createTaskDto.dueDate
    ) {
      throw new BadRequestException({ error: 'Missing required fields' });
    }
    const date = new Date(createTaskDto.dueDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException({ error: 'Invalid date format' });
    }
    return this.tasksService.create(req.user.userId, {
      ...createTaskDto,
      dueDate: date,
    });
  }

  @Put(':id')
  @HttpCode(200)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body()
    updateTaskDto: Partial<{
      title: string;
      description: string;
      dueDate: string;
      completed: boolean;
    }>,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({ error: 'Invalid task ID' });
    }
    const updatedData: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      const date = new Date(updateTaskDto.dueDate);
      if (isNaN(date.getTime())) {
        throw new BadRequestException({ error: 'Invalid date format' });
      }
      updatedData.dueDate = date;
    }
    return this.tasksService.update(id, req.user.userId, updatedData);
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Request() req, @Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException({ error: 'Invalid task ID' });
    }
    await this.tasksService.remove(id, req.user.userId);
    return { message: 'Task deleted successfully' };
  }
}
