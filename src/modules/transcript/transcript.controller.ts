import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ITranscript } from '../../common/interfaces/transcript';
import { CreateTranscriptDto, UpdateTranscriptDto } from './dto';
import { TranscriptService } from './transcript.service';

@ApiTags('transcripts')
@Controller('companies/:companyId/calllogs/:calllogId/transcript')
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transcript' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The transcript has been successfully created.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request.' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'CallLog not found.',
  })
  async create(
    @Param('calllogId') calllogId: string,
    @Body() createTranscriptDto: CreateTranscriptDto,
  ): Promise<ITranscript> {
    return this.transcriptService.create({
      calllogId,
      ...createTranscriptDto,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get transcript by calllog ID' })
  @ApiResponse({ status: 200, description: 'Return transcript' })
  @ApiResponse({ status: 404, description: 'Transcript not found' })
  async findByCallLogId(
    @Param('calllogId') calllogId: string,
  ): Promise<ITranscript> {
    return await this.transcriptService.findByCallLogId(calllogId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update transcript' })
  @ApiResponse({ status: 200, description: 'Return updated transcript' })
  @ApiResponse({ status: 404, description: 'Transcript not found' })
  async update(
    @Param('calllogId') calllogId: string,
    @Body() updateTranscriptDto: UpdateTranscriptDto,
  ): Promise<ITranscript> {
    const transcript = await this.transcriptService.findByCallLogId(calllogId);
    return this.transcriptService.update(
      transcript._id.toString(),
      updateTranscriptDto,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Delete transcript' })
  @ApiResponse({ status: 200, description: 'Return deleted transcript' })
  @ApiResponse({ status: 404, description: 'Transcript not found' })
  async delete(@Param('calllogId') calllogId: string): Promise<ITranscript> {
    const transcript = await this.transcriptService.findByCallLogId(calllogId);
    return this.transcriptService.delete(transcript._id.toString());
  }
}
