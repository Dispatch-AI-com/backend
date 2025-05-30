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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TranscriptService } from './transcript.service';
import { CreateTranscriptDto, UpdateTranscriptDto } from './dto';
import { ITranscript } from '../../common/interfaces/transcript';

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
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'CallLog not found.' })
  async createTranscript(
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the transcript.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transcript not found.' })
  async getTranscript(@Param('calllogId') calllogId: string): Promise<ITranscript> {
    try {
      return await this.transcriptService.findByCallLogId(calllogId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Patch()
  @ApiOperation({ summary: 'Update a transcript' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The transcript has been successfully updated.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transcript not found.' })
  async updateTranscript(
    @Param('calllogId') calllogId: string,
    @Body() updateTranscriptDto: UpdateTranscriptDto,
  ): Promise<ITranscript> {
    const transcript = await this.transcriptService.findByCallLogId(calllogId);
    return this.transcriptService.update(transcript._id.toString(), updateTranscriptDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a transcript' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The transcript has been successfully deleted.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Transcript not found.' })
  async deleteTranscript(@Param('calllogId') calllogId: string): Promise<ITranscript> {
    const transcript = await this.transcriptService.findByCallLogId(calllogId);
    return this.transcriptService.delete(transcript._id.toString());
  }
}
