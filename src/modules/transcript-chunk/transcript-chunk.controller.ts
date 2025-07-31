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
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ITranscriptChunk } from '@/common/interfaces/transcript-chunk';

import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { QueryTranscriptChunkDto } from './dto/query-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';
import { TranscriptChunk } from './schema/transcript-chunk.schema';
import { TranscriptChunkService } from './transcript-chunk.service';

@ApiTags('transcript-chunks')
@Controller('transcripts/:transcriptId/chunks')
export class TranscriptChunkController {
  constructor(
    private readonly transcriptChunkService: TranscriptChunkService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create transcript chunk(s)' })
  @ApiCreatedResponse({
    description: 'The transcript chunk(s) have been successfully created.',
    type: [TranscriptChunk],
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Transcript not found' })
  async create(
    @Param('transcriptId') transcriptId: string,
    @Body() body: CreateTranscriptChunkDto | CreateTranscriptChunkDto[],
  ): Promise<ITranscriptChunk | ITranscriptChunk[]> {
    if (Array.isArray(body)) {
      return this.transcriptChunkService.createMany(transcriptId, body);
    }
    return this.transcriptChunkService.create(transcriptId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chunks for a transcript' })
  @ApiOkResponse({
    description: 'Return all chunks for the transcript',
    type: [TranscriptChunk],
  })
  @ApiQuery({ name: 'speakerType', enum: ['AI', 'User'], required: false })
  @ApiQuery({ name: 'startAt', type: Number, required: false })
  @ApiQuery({ name: 'endAt', type: Number, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  findAll(
    @Param('transcriptId') transcriptId: string,
    @Query() query: QueryTranscriptChunkDto,
  ): Promise<{
    data: ITranscriptChunk[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    return this.transcriptChunkService.findAll(transcriptId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transcript chunk by ID' })
  @ApiOkResponse({
    description: 'Return the transcript chunk',
    type: TranscriptChunk,
  })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  findOne(
    @Param('transcriptId') transcriptId: string,
    @Param('id') id: string,
  ): Promise<ITranscriptChunk> {
    return this.transcriptChunkService.findOne(transcriptId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transcript chunk' })
  @ApiOkResponse({
    description: 'The transcript chunk has been successfully updated.',
    type: TranscriptChunk,
  })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptChunkDto,
  ): Promise<ITranscriptChunk> {
    return this.transcriptChunkService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transcript chunk' })
  @ApiOkResponse({
    description: 'The transcript chunk has been successfully deleted.',
    type: TranscriptChunk,
  })
  @ApiNotFoundResponse({ description: 'Transcript chunk not found' })
  delete(@Param('id') id: string): Promise<ITranscriptChunk> {
    return this.transcriptChunkService.delete(id);
  }
}
