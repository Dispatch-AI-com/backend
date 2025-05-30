import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ITranscriptChunk } from '@/common/interfaces/transcript-chunk';

import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';
import { TranscriptChunk } from './schema/transcript-chunk.schema';
import { TranscriptChunkService } from './transcript-chunk.service';
import { QueryTranscriptChunkDto } from './dto/query-transcript-chunk.dto';

@ApiTags('transcript-chunks')
@Controller('transcripts/:transcriptId/chunks')
export class TranscriptChunkController {
  constructor(private readonly transcriptChunkService: TranscriptChunkService) {}

  @Get()
  @ApiOperation({ summary: 'Get all chunks for a transcript' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all chunks for the specified transcript',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transcript not found' })
  async findAll(
    @Param('transcriptId') transcriptId: string,
    @Query() query: QueryTranscriptChunkDto,
  ): Promise<ITranscriptChunk[]> {
    try {
      return await this.transcriptChunkService.findAll(transcriptId, query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple chunks for a transcript' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The chunks have been successfully created',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transcript not found' })
  async createMany(
    @Param('transcriptId') transcriptId: string,
    @Body() createDtos: CreateTranscriptChunkDto[],
  ): Promise<ITranscriptChunk[]> {
    return this.transcriptChunkService.createMany(transcriptId, createDtos);
  }

  @Get(':chunkId')
  @ApiOperation({ summary: 'Get a specific chunk' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the specified chunk',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chunk not found' })
  async findOne(
    @Param('transcriptId') transcriptId: string,
    @Param('chunkId') chunkId: string,
  ): Promise<ITranscriptChunk> {
    try {
      return await this.transcriptChunkService.findOne(transcriptId, chunkId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Patch(':id')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    return this.transcriptChunkService.update(id, dto);
  }

  @Patch(':id/sanitized')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  sanitizedUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    return this.transcriptChunkService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: TranscriptChunk })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  delete(@Param('id') id: string): Promise<ITranscriptChunk> {
    return this.transcriptChunkService.delete(id);
  }
}
