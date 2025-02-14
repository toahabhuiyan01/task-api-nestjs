import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private sanitizeUser(user: any) {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user.toJSON();
    return result;
  }

  @Get('profile')
  @HttpCode(200)
  async getProfile(@Request() req) {
    const user = await this.userModel.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { user: this.sanitizeUser(user) };
  }

  @Put('profile')
  @HttpCode(200)
  async updateProfile(@Request() req, @Body() updateDto: { name: string }) {
    if (
      !updateDto.name ||
      typeof updateDto.name !== 'string' ||
      updateDto.name.trim().length === 0
    ) {
      throw new BadRequestException(
        'Name is required and must be a non-empty string',
      );
    }

    const user = await this.userModel.findByIdAndUpdate(
      req.user.userId,
      { $set: { name: updateDto.name.trim() } },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { user: this.sanitizeUser(user) };
  }
}
