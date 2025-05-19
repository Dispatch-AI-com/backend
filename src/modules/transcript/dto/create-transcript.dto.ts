import { IsMongoId, IsString, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateTranscriptDto {
  @IsMongoId()
  @IsNotEmpty()
  calllogid!: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  summary!: string;
}
