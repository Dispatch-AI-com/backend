import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';
import { TranscriptChunk } from './schema/transcript_chunk.schema';
import { TranscriptChunkService } from './transcript_chunk.service';

@ApiTags('TranscriptChunks')
@Controller('transcript-chunks')
export class TranscriptChunkController {
  constructor(private readonly chunkService: TranscriptChunkService) {}

  @Post()
  @ApiCreatedResponse({ type: TranscriptChunk })
  @ApiBadRequestResponse({ description: 'Invalid input or time overlap' })
  create(@Body() dto: CreateTranscriptChunkDto): Promise<TranscriptChunk> {
    return this.chunkService.create(dto);
  }

  @Get(':transcriptId')
  @ApiOkResponse({ type: [TranscriptChunk] })
  findAll(
    @Param('transcriptId') transcriptId: string,
  ): Promise<TranscriptChunk[]> {
    return this.chunkService.findAll(transcriptId);
  }

  @Get('chunk/:id')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  findOne(@Param('id') id: string): Promise<TranscriptChunk> {
    return this.chunkService.findOne(id);
  }

  @Patch('chunk/:id')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptChunkDto,
  ): Promise<TranscriptChunk> {
    return this.chunkService.update(id, dto);
  }

  @Patch('chunk/:id/sanitized')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  sanitizedUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptChunkDto,
  ): Promise<TranscriptChunk> {
    return this.chunkService.sanitizedUpdate(id, dto);
  }

  @Delete('chunk/:id')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  delete(@Param('id') id: string): Promise<TranscriptChunk> {
    return this.chunkService.delete(id);
  }
}
