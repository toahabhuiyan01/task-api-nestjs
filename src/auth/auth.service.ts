import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toJSON();
      return result;
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException({ error: 'Invalid credentials' });
    }

    const payload = { userId: user._id };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async register(userData: { name: string; email: string; password: string }) {
    const existingUser = await this.userModel.findOne({
      email: userData.email,
    });
    if (existingUser) {
      throw new BadRequestException({ error: 'Email already registered' });
    }

    const user = await this.userModel.create(userData);
    const payload = { userId: user._id };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // Return success even if user not found for security
      return {
        message:
          'If a user with this email exists, they will receive a password reset link.',
      };
    }

    const resetToken = this.jwtService.sign(
      { userId: user._id },
      { expiresIn: '1h' },
    );

    return {
      message:
        'If a user with this email exists, they will receive a password reset link.',
      resetToken, // Only for development, should be sent via email in production
    };
  }

  async resetPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password has been reset successfully' };
  }
}
