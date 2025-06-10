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

import { CallLogStatus } from '@/common/constants/calllog.constant';
import { ICallLog } from '@/common/interfaces/calllog';

import { CalllogService } from './calllog.service';
import { CreateCallLogDto } from './dto/create-calllog.dto';
import { UpdateCallLogDto } from './dto/update-calllog.dto';
import { CallLog, CallLogDocument } from './schema/calllog.schema';

@ApiTags('calllog')
@Controller('users/:userId/calllogs')
export class CalllogController {
  constructor(private readonly calllogService: CalllogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all call logs for a user' })
  @ApiQuery({ name: 'status', required: false, enum: CallLogStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'startAtFrom', required: false, type: String })
  @ApiQuery({ name: 'startAtTo', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Return paginated call logs' })
  async findAll(
    @Param('userId') userId: string,
    @Query('status') status?: CallLogStatus,
    @Query('search') search?: string,
    @Query('startAtFrom') startAtFrom?: string,
    @Query('startAtTo') startAtTo?: string,
    @Query('sort') sort?: 'newest' | 'oldest',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{
    data: ICallLog[];
    pagination: { page: number; limit: number; total: number };
  }> {
    return this.calllogService.findAll({
      userId,
      status,
      search,
      startAtFrom,
      startAtTo,
      sort,
      page,
      limit,
    });
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

  @Get('metrics/today')
  @ApiOperation({ summary: "Get today's call metrics" })
  @ApiResponse({ status: 200, description: "Return today's call metrics" })
  async getTodayMetrics(@Param('userId') userId: string): Promise<{
    totalCalls: number;
    liveCalls: number;
  }> {
    return this.calllogService.getTodayMetrics(userId);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calllog and all its associated data' })
  @ApiOkResponse({
    description:
      'The calllog and all its associated data have been successfully deleted.',
    type: CallLog,
  })
  @ApiNotFoundResponse({ description: 'Calllog not found' })
  @ApiBadRequestResponse({ description: 'Invalid calllog ID' })
  async delete(@Param('id') id: string): Promise<CallLogDocument> {
    return this.calllogService.delete(id);
  }
}
