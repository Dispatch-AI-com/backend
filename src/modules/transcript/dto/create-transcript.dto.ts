import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateTranscriptDto {
  @IsMongoId()
  @IsNotEmpty()
  @Type(() => String)
  calllogid!: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  summary!: string;
}
