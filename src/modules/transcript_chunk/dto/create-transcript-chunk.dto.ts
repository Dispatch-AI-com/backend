import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateTranscriptChunkDto {
  @IsMongoId()
  @IsNotEmpty()
  transcriptId!: string;

  @IsEnum(['AI', 'User'])
  speakerType!: 'AI' | 'User';

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsDate()
  @Type(() => Date)
  startAt!: Date;

  @IsDate()
  @Type(() => Date)
  endAt!: Date;
}
