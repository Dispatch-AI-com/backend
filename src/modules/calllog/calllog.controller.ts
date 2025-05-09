import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CalllogService } from './calllog.service';
import { CreateCallLogDto } from './dto/create-calllog.dto';

@ApiTags('calllog')
@Controller('calllog')
export class CalllogController {
  constructor(private readonly calllogService: CalllogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new call log' })
  @ApiResponse({ status: 201, description: 'Call log created successfully' })
  create(@Body() createCallLogDto: CreateCallLogDto) {
    return this.calllogService.create(createCallLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all call logs' })
  @ApiResponse({ status: 200, description: 'Return all call logs' })
  findAll() {
    return this.calllogService.findAll();
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get call logs by company ID' })
  @ApiResponse({ status: 200, description: 'Return call logs for the specified company' })
  findByCompanyId(@Query('companyId') companyId: string) {
    return this.calllogService.findByCompanyId(companyId);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get call logs by date range' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiResponse({ status: 200, description: 'Return call logs within the specified date range' })
  findByStartAt(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.calllogService.findByStartAt(startDate, endDate);
  }
}
