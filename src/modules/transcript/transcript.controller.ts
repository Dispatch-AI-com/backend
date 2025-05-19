import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateTranscriptDto, UpdateTranscriptDto } from './dto';
import { TranscriptService } from './transcript.service';

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
