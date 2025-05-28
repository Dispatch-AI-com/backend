import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ITranscriptChunk } from '@/common/interfaces/transcript_chuck';

import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';
import { TranscriptChunk } from './schema/transcript_chunk.schema';
import { TranscriptChunkService } from './transcript_chunk.service';

@ApiTags('TranscriptChunk')
@Controller('transcript-chunk')
export class TranscriptChunkController {
  constructor(private readonly chunkService: TranscriptChunkService) {}

  @Post()
  @ApiCreatedResponse({ type: TranscriptChunk })
  @ApiBadRequestResponse({ description: 'Invalid input or time overlap' })
  create(@Body() dto: CreateTranscriptChunkDto): Promise<ITranscriptChunk> {
    return this.chunkService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [TranscriptChunk] })
  findAll(@Query('transcriptId') transcriptId?: string): Promise<ITranscriptChunk[]> {
    if (transcriptId) {
      return this.chunkService.findAll(transcriptId);
    }
    return this.chunkService.findAllChunks();
  }

  @Get(':id')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  findOne(@Param('id') id: string): Promise<ITranscriptChunk> {
    return this.chunkService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    return this.chunkService.update(id, dto);
  }

  @Patch(':id/sanitized')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  sanitizedUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    return this.chunkService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  delete(@Param('id') id: string): Promise<ITranscriptChunk> {
    return this.chunkService.delete(id);
  }
}
