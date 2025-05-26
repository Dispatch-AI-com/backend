import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  tag!: string[];

  @Prop({ required: true, type: Date })
  date!: Date;

  @Prop({ required: true })
  author!: string;

  @Prop()
  videoUrl?: string;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.index({ date: -1 });
