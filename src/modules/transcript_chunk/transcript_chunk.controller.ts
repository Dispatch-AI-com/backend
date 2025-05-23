import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { TranscriptChunkService } from './transcript_chunk.service';
import { CreateTranscriptChunkDto } from './dto/create-transcript-chunk.dto';
import { UpdateTranscriptChunkDto } from './dto/update-transcript-chunk.dto';

@Controller('transcript-chunks')
export class TranscriptChunkController {
  constructor(private readonly chunkService: TranscriptChunkService) {}

  @Post()
  create(@Body() dto: CreateTranscriptChunkDto) {
    return this.chunkService.create(dto);
  }

  @Get(':transcriptId')
  findAll(@Param('transcriptId') transcriptId: string) {
    return this.chunkService.findAll(transcriptId);
  }

  @Get('chunk/:id')
  findOne(@Param('id') id: string) {
    return this.chunkService.findOne(id);
  }

  @Patch('chunk/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTranscriptChunkDto) {
    return this.chunkService.update(id, dto);
  }

  @Delete('chunk/:id')
  delete(@Param('id') id: string) {
    return this.chunkService.delete(id);
  }
}