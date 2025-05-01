import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { User } from '@/modules/user/schema/user.schema';

@Schema({ timestamps: true })
export class Company {
    @Prop({ required: true })
    businessName: string;

    @Prop({ required: true })
    jobTitle: string;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    user: User;
}

export type CompanyDocument = Company & Document;
export const CompanySchema = SchemaFactory.createForClass(Company); 