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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ICallLog, ICallLogSummary } from '@/common/interfaces/calllog';

import { CalllogService } from './calllog.service';
import { CreateCallLogDto } from './dto/create-calllog.dto';
import { UpdateCallLogDto } from './dto/update-calllog.dto';
import { CallLog, CallLogDocument } from './schema/calllog.schema';

@ApiTags('calllog')
@Controller('users/:userId/calllogs')
export class CalllogController {
  constructor(private readonly calllogService: CalllogService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get call logs summary' })
  @ApiResponse({ status: 200, description: 'Return call logs summary' })
  async getSummary(
    @Param('userId') userId: string,
    @Query('startAtFrom') startAtFrom?: string,
    @Query('startAtTo') startAtTo?: string,
  ): Promise<ICallLogSummary> {
    return this.calllogService.getSummary(userId, startAtFrom, startAtTo);
  }

  @Get('metrics/today')
  @ApiOperation({ summary: "Get today's call metrics" })
  @ApiResponse({ status: 200, description: "Return today's call metrics" })
  async getTodayMetrics(@Param('userId') userId: string): Promise<{
    totalCalls: number;
  }> {
    const metrics = await this.calllogService.getTodayMetrics(userId);
    return {
      totalCalls:
        typeof metrics.totalCalls === 'number' ? metrics.totalCalls : 0,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all call logs for a user' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'startAtFrom', required: false, type: String })
  @ApiQuery({ name: 'startAtTo', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 50)',
  })
  @ApiQuery({
    name: 'fields',
    required: false,
    type: String,
    description: 'Comma-separated fields to return (e.g., "id,status,startAt")',
  })
  @ApiResponse({ status: 200, description: 'Return paginated call logs' })
  async findAll(
    @Param('userId') userId: string,
    @Query('search') search?: string,
    @Query('startAtFrom') startAtFrom?: string,
    @Query('startAtTo') startAtTo?: string,
    @Query('sort') sort?: 'newest' | 'oldest',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('fields') fields?: string,
  ): Promise<{
    data: ICallLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const validatedPage = Math.max(1, typeof page === 'number' ? page : 1);
    const validatedLimit = Math.min(
      50,
      Math.max(1, typeof limit === 'number' ? limit : 10),
    );

    const selectedFields =
      fields != null && fields.length > 0
        ? fields.split(',').reduce<Record<string, 1>>((acc, field) => {
            acc[field.trim()] = 1;
            return acc;
          }, {})
        : undefined;

    return this.calllogService.findAll({
      userId,
      search,
      startAtFrom,
      startAtTo,
      sort,
      page: validatedPage,
      limit: validatedLimit,
      fields: selectedFields,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new call log' })
  @ApiResponse({ status: 201, description: 'Call log created successfully' })
  async create(
    @Param('userId') userId: string,
    @Body() createCallLogDto: CreateCallLogDto,
  ): Promise<ICallLog> {
    const dto = Object.assign({}, createCallLogDto, { userId });
    return this.calllogService.create(dto);
  }

  @Get(':calllogId/audio')
  @ApiOperation({ summary: 'Get call audio ID' })
  @ApiResponse({ status: 200, description: 'Return audio ID' })
  @ApiResponse({ status: 404, description: 'Audio not found' })
  async getAudio(
    @Param('userId') userId: string,
    @Param('calllogId') calllogId: string,
  ): Promise<{ audioId: string }> {
    const audioId = await this.calllogService.getAudio(userId, calllogId);
    return { audioId };
  }

  @Get(':calllogId')
  @ApiOperation({ summary: 'Get call log details' })
  @ApiResponse({ status: 200, description: 'Return call log details' })
  @ApiResponse({ status: 404, description: 'Call log not found' })
  async findOne(
    @Param('userId') userId: string,
    @Param('calllogId') calllogId: string,
  ): Promise<ICallLog> {
    return this.calllogService.findOne(userId, calllogId);
  }

  @Patch(':calllogId')
  @ApiOperation({ summary: 'Update a call log' })
  @ApiResponse({ status: 200, description: 'Call log updated successfully' })
  @ApiResponse({ status: 404, description: 'Call log not found' })
  async update(
    @Param('userId') userId: string,
    @Param('calllogId') calllogId: string,
    @Body() updateCallLogDto: UpdateCallLogDto,
  ): Promise<ICallLog> {
    return this.calllogService.update(userId, calllogId, updateCallLogDto);
  }

  @Delete(':calllogId')
  @ApiOperation({ summary: 'Delete a calllog and all its associated data' })
  @ApiOkResponse({
    description:
      'The calllog and all its associated data have been successfully deleted.',
    type: CallLog,
  })
  @ApiNotFoundResponse({ description: 'Calllog not found' })
  @ApiBadRequestResponse({ description: 'Invalid calllog ID' })
  async delete(
    @Param('userId') userId: string,
    @Param('calllogId') calllogId: string,
  ): Promise<CallLogDocument> {
    return this.calllogService.delete(userId, calllogId);
  }
}
