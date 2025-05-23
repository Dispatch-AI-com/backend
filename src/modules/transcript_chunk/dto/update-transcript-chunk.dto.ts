import { PartialType } from '@nestjs/mapped-types';
import { CreateTranscriptChunkDto } from './create-transcript-chunk.dto';

export class UpdateTranscriptChunkDto extends PartialType(CreateTranscriptChunkDto) {}
