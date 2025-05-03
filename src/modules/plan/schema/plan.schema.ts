import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PlanDocument = HydratedDocument<Plan>;

@Schema()
export class Plan {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, enum: ["FREE", "BASIC", "PRO"] })
  tier!: "FREE" | "BASIC" | "PRO";

  @Prop({
    type: [
      {
        rrule: { type: String, required: true }, // e.g. "FREQ=MONTHLY;INTERVAL=1"
        price: { type: Number, required: true },
      },
    ],
    required: true,
  })
  pricing!: {
    rrule: string;
    price: number;
  }[];

  @Prop({
    type: {
      callMinutes: { type: String, required: true },
      support: { type: String, required: true },
    },
    required: true,
  })
  features!: {
    callMinutes: string;
    support: string;
  };

  @Prop({ default: true })
  isActive!: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
