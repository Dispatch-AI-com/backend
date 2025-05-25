import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CreateTranscriptDto, UpdateTranscriptDto } from './dto';
import { Transcript } from './schema/transcript.schema';
import { TranscriptService } from './transcript.service';

@ApiTags('Transcripts')
@Controller('transcripts')
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Post()
  @ApiOkResponse({ type: Transcript })
  create(@Body() dto: CreateTranscriptDto): Promise<Transcript> {
    return this.transcriptService.create(dto);
  }

  @Get('calllog/:calllogid')
  @ApiOkResponse({ type: [Transcript] })
  findByCalllog(@Param('calllogid') calllogid: string): Promise<Transcript[]> {
    return this.transcriptService.findByCalllogId(calllogid);
  }

  @Patch(':id')
  @ApiOkResponse({ type: Transcript })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTranscriptDto,
  ): Promise<Transcript> {
    return this.transcriptService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: Transcript })
  delete(@Param('id') id: string): Promise<Transcript> {
    return this.transcriptService.delete(id);
  }
}
