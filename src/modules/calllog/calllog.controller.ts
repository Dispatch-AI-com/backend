import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ICallLog } from '@/common/interfaces/calllog';

import { CalllogService } from './calllog.service';
import { CreateCallLogDto } from './dto/create-calllog.dto';
import { UpdateCallLogDto } from './dto/update-calllog.dto';

@ApiTags('calllog')
@Controller('calllog')
export class CalllogController {
  constructor(private readonly calllogService: CalllogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new call log' })
  @ApiResponse({ status: 201, description: 'Call log created successfully' })
  create(@Body() createCallLogDto: CreateCallLogDto): Promise<ICallLog> {
    return this.calllogService.create(createCallLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all call logs' })
  @ApiResponse({ status: 200, description: 'Return all call logs' })
  findAll(): Promise<ICallLog[]> {
    return this.calllogService.findAll();
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get call logs by company ID' })
  @ApiResponse({
    status: 200,
    description: 'Return call logs for the specified company',
  })
  @ApiResponse({
    status: 404,
    description: 'No call logs found for the specified company ID',
  })
  findByCompanyId(@Param('companyId') companyId: string): Promise<ICallLog[]> {
    return this.calllogService.findByCompanyId(companyId);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get call logs by date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return call logs within the specified date range',
  })
  @ApiResponse({
    status: 404,
    description: 'No call logs found within the specified date range',
  })
  findByStartAt(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ICallLog[]> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return this.calllogService.findByStartAt(start, end);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a call log' })
  @ApiResponse({ status: 200, description: 'Call log updated successfully' })
  @ApiResponse({ status: 404, description: 'Call log not found' })
  update(
    @Param('id') id: string,
    @Body() updateCallLogDto: UpdateCallLogDto,
  ): Promise<ICallLog> {
    return this.calllogService.update(id, updateCallLogDto);
  }
}
