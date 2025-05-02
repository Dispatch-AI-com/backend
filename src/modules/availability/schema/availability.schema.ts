import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Availability extends Document {
  // @Prop({ type: Types.ObjectId, ref: "Service", required: true })
  //serviceId: Types.ObjectId;
  @Prop({ required: false }) // for testing
  serviceId?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  repeatRule: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ default: true })
  isAvailable: boolean;
}

export type AvailabilityDocument = Availability & Document;
export const AvailabilitySchema = SchemaFactory.createForClass(Availability);
