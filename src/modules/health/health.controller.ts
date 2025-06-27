import { randomUUID } from 'node:crypto';

import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HealthService } from '@/modules/health/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({
    summary: 'Health Check',
    description: 'Check if the API is running',
  })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  @Get()
  check(): {
    status: string;
    timestamp: Date;
    service: string;
    environment: string;
  } {
    return this.healthService.check();
  }

  @ApiOperation({
    summary: 'Database Health Check',
    description: 'Check if the database connection is working',
  })
  @ApiResponse({ status: 200, description: 'Database connection is healthy' })
  @ApiResponse({ status: 503, description: 'Database connection failed' })
  @Get('db')
  checkDatabase(): { status: string } {
    return this.healthService.checkDatabase();
  }

  @ApiOperation({
    summary: 'Test AI chat Endpoint',
    description: 'Proxy a test message to AI server',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Hello AI' },
        callSid: {
          type: 'string',
          example: '7e1ef53e-87fc-4169-9c4b-df8ea79906b0',
          nullable: true,
        },
      },
      required: ['message'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'AI reply',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        replyText: { type: 'string', example: '你好！我是一个 AI 助手 …' },
        timestamp: { type: 'string', format: 'date-time' },
        duration: { type: 'number', example: 2155 },
        error: { type: 'string', nullable: true },
      },
    },
  })
  @Post('test-ai-chat')
  testAIChat(
    @Body('message') message: string,
    @Body('callSid') callSid?: string,
  ): Promise<{
    status: string;
    replyText?: string;
    timestamp: Date;
    duration?: number;
    error?: string;
  }> {
    const sid = callSid ?? randomUUID();
    return this.healthService.testAIChat(message, sid);
  }

  @ApiOperation({
    summary: 'Test AI ping',
    description: 'Returns a test message from AI server',
  })
  @ApiResponse({ status: 200, description: 'Returns Test message' })
  @Get('pingAI')
  ping(): Promise<{
    status: string;
    message?: string;
    timestamp: Date;
    duration?: number;
    error?: string;
  }> {
    return this.healthService.pingAI();
  }

  @ApiOperation({
    summary: 'Unauthorized Endpoint',
    description: 'Simulates an unauthorized access attempt',
  })
  @ApiResponse({ status: 401, description: 'JWT token is invalid or expired' })
  @Get('unauthorized')
  unauthorized(): never {
    throw new UnauthorizedException('JWT token is invalid or expired');
  }

  @ApiOperation({
    summary: 'Unauthorized Endpoint',
    description: 'Simulates an unauthorized access attempt',
  })
  @ApiResponse({ status: 401, description: 'JWT token is invalid or expired' })
  @Get('unauthorized')
  unauthorized(): never {
    throw new UnauthorizedException('JWT token is invalid or expired');
  }
}
