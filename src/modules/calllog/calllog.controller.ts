import { Controller, Get, Post, Body } from '@nestjs/common';
import { CalllogService } from './calllog.service';
import { CreateCallLogDto } from './dto/create-calllog.dto';

@Controller('calllog')
export class CalllogController {
  constructor(private readonly calllogService: CalllogService) {}

  @Post()
  create(@Body() createCallLogDto: CreateCallLogDto) {
    return this.calllogService.create(createCallLogDto);
  }

  @Get()
  findAll() {
    return this.calllogService.findAll();
  }
}
