import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { SkipCSRF } from '@/common/decorators/skip-csrf.decorator';
import { ICallLog } from '@/common/interfaces/calllog';

import { CalllogService } from './calllog.service';
import { CreateCallLogDto } from './dto/create-calllog.dto';

/**
 * Internal Call Log Controller
 *
 * This controller provides endpoints for internal services (like AI service)
 * to create call logs without authentication requirements.
 *
 * NOTE: These endpoints should NOT be exposed publicly.
 * They are intended for inter-service communication only.
 */
@ApiExcludeController()
@Controller('internal/users/:userId/calllogs')
export class InternalCalllogController {
  constructor(private readonly calllogService: CalllogService) {}

  @Post()
  @SkipCSRF()
  async create(
    @Param('userId') userId: string,
    @Body() createCallLogDto: CreateCallLogDto,
  ): Promise<ICallLog> {
    const dto = Object.assign({}, createCallLogDto, { userId });
    return this.calllogService.create(dto);
  }
}
