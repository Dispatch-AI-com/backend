import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LocationDocument = HydratedDocument<Location>;

@Schema({ timestamps: true })
export class Location {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: false })
  address1?: string;

  @Prop({ required: false })
  address2?: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  country!: string;

  @Prop({ type: [Number], required: false })
  embedding?: number[];
}

export const LocationSchema = SchemaFactory.createForClass(Location);
