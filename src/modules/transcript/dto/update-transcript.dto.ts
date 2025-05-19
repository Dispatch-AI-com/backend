import { PartialType } from '@nestjs/mapped-types';
import { CreateTranscriptDto } from './create-transcript.dto';

export class UpdateTranscriptDto extends PartialType(CreateTranscriptDto) {}
