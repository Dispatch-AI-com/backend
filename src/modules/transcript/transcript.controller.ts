import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { CreateTranscriptDto, UpdateTranscriptDto } from './dto';

@Controller('transcripts')
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Post()
  create(@Body() dto: CreateTranscriptDto) {
    return this.transcriptService.create(dto);
  }

  @Get('calllog/:calllogid')
  findByCalllog(@Param('calllogid') calllogid: string) {
    return this.transcriptService.findByCalllogId(calllogid);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTranscriptDto) {
    return this.transcriptService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.transcriptService.delete(id);
  }
    
}
