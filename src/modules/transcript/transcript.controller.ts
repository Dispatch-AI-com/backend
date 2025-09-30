import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ITranscript } from '@/common/interfaces/transcript';

import { CreateTranscriptDto } from './dto/create-transcript.dto';
import { UpdateTranscriptDto } from './dto/update-transcript.dto';
import { Transcript } from './schema/transcript.schema';
import { TranscriptService } from './transcript.service';

@ApiTags('transcripts')
@Controller('calllogs/:calllogId/transcript')
@UseGuards(AuthGuard('jwt'))
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transcript for a call log' })
  @ApiCreatedResponse({
    description: 'The transcript has been successfully created.',
    type: Transcript,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Call log not found' })
  async create(
    @Param('calllogId') calllogId: string,
    @Body() createTranscriptDto: CreateTranscriptDto,
  ): Promise<ITranscript> {
    // First find the CallLog to get its callSid
    const calllog = await this.transcriptService.findCallLogById(calllogId);
    return this.transcriptService.create({
      callSid: calllog.callSid,
      summary: createTranscriptDto.summary,
      keyPoints: createTranscriptDto.keyPoints,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get transcript by call log ID' })
  @ApiOkResponse({
    description: 'Return the transcript',
    type: Transcript,
  })
  @ApiNotFoundResponse({ description: 'Transcript not found' })
  async findByCalllogId(
    @Param('calllogId') calllogId: string,
  ): Promise<ITranscript> {
    return this.transcriptService.findByCallLogId(calllogId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update transcript by call log ID' })
  @ApiOkResponse({
    description: 'The transcript has been successfully updated.',
    type: Transcript,
  })
  @ApiNotFoundResponse({ description: 'Transcript not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateByCalllogId(
    @Param('calllogId') calllogId: string,
    @Body() updateTranscriptDto: UpdateTranscriptDto,
  ): Promise<ITranscript> {
    const transcript = await this.transcriptService.findByCallLogId(calllogId);
    return this.transcriptService.update(transcript._id, updateTranscriptDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete transcript by call log ID' })
  @ApiOkResponse({
    description: 'The transcript has been successfully deleted.',
    type: Transcript,
  })
  @ApiNotFoundResponse({ description: 'Transcript not found' })
  async deleteByCalllogId(
    @Param('calllogId') calllogId: string,
  ): Promise<ITranscript> {
    const transcript = await this.transcriptService.findByCallLogId(calllogId);
    return this.transcriptService.delete(transcript._id);
  }
}
