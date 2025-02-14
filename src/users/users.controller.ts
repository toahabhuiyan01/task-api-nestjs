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
  async updateProfile(
    @Request() req,
    @Body()
    updateDto: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const user = await this.userModel.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateDto.name !== undefined) {
      if (
        typeof updateDto.name !== 'string' ||
        updateDto.name.trim().length === 0
      ) {
        throw new BadRequestException('Name must be a non-empty string');
      }
      user.name = updateDto.name.trim();
    }

    if (updateDto.email !== undefined) {
      if (
        typeof updateDto.email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateDto.email)
      ) {
        throw new BadRequestException('Invalid email format');
      }

      const existingUser = await this.userModel.findOne({
        email: updateDto.email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (existingUser) {
        throw new BadRequestException('Email is already registered');
      }

      user.email = updateDto.email.toLowerCase();
    }

    if (
      updateDto.currentPassword !== undefined ||
      updateDto.newPassword !== undefined
    ) {
      if (!updateDto.currentPassword || !updateDto.newPassword) {
        throw new BadRequestException(
          'Both old and new passwords are required',
        );
      }

      const isValidPassword = await user.comparePassword(
        updateDto.currentPassword,
      );
      if (!isValidPassword) {
        throw new BadRequestException('Current password is incorrect');
      }

      user.password = updateDto.newPassword;
    }

    await user.save();
    return {
      user: this.sanitizeUser(user),
      message: 'Profile updated successfully',
    };
  }
}
