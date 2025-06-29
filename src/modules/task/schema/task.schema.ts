import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, type: Object })
  createdBy!: { name: string; avatar: string };

  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  dateTime!: Date;

  @Prop()
  description?: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);