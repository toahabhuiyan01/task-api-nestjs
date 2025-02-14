import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ default: 'pending', enum: ['pending', 'completed'] })
  status: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
