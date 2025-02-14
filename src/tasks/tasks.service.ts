import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async findAll(userId: string) {
    return this.taskModel.find({ userId }).sort({ createdAt: -1 });
  }

  async findOne(id: string, userId: string) {
    const task = await this.taskModel.findOne({ _id: id, userId });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(
    userId: string,
    createTaskDto: { title: string; description: string; dueDate: Date },
  ) {
    const task = await this.taskModel.create({
      userId,
      ...createTaskDto,
    });
    return task;
  }

  async update(id: string, userId: string, updateTaskDto: Partial<Task>) {
    const updateData = { ...updateTaskDto };
    if (typeof updateData.completed === 'boolean') {
      updateData.status = updateData.completed ? 'completed' : 'pending';
    }
    const task = await this.taskModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true },
    );
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async remove(id: string, userId: string) {
    const task = await this.taskModel.findOneAndDelete({ _id: id, userId });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }
}
