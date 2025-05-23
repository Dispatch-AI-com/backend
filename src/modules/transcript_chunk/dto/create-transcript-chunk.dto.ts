import { IsMongoId, IsNotEmpty, IsString, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

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