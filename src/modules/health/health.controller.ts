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
    summary: 'API Health Status',
    description: 'Endpoint for monitoring service availability and operational status. Returns service metadata, current environment, and timestamp information.',
  })
  @ApiResponse({ status: 200, description: 'Service is operational and healthy' })
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
    summary: 'Database Connectivity Status',
    description: 'Validates database connectivity and health. Returns connection status for MongoDB and Redis instances.',
  })
  @ApiResponse({ status: 200, description: 'All database connections are healthy' })
  @ApiResponse({ status: 503, description: 'One or more database connections have failed' })
  @Get('db')
  checkDatabase(): {
    status: string;
    mongo: boolean;
    redis: boolean;
    timestamp: Date;
  } {
    return this.healthService.checkDatabase();
  }

  @ApiOperation({
    summary: 'AI Service Chat Integration Test',
    description: 'Validates AI service connectivity by sending a test message and measuring response time. Used for integration testing and monitoring.',
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
    summary: 'MCP Service Health Probe',
    description: 'Performs a health check against the MCP (Model Context Protocol) server. Returns connectivity status and response latency.',
  })
  @ApiResponse({ status: 200, description: 'MCP service is responding normally' })
  @Get('mcp_ping')
  mcpPing(): Promise<{
    status: string;
    message?: string;
    timestamp: Date;
    duration?: number;
    error?: string;
  }> {
    return this.healthService.mcpPing();
  }

  @ApiOperation({
    summary: 'AI Service Health Probe',
    description: 'Performs a health check against the AI service backend. Returns connectivity status and response latency metrics.',
  })
  @ApiResponse({ status: 200, description: 'AI service is responding normally' })
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
    summary: 'Authentication Error Simulation',
    description: 'Test endpoint that simulates an unauthorized access scenario. Used for testing error handling and authentication flows.',
  })
  @ApiResponse({ status: 401, description: 'Returns authentication failure response' })
  @Get('unauthorized')
  unauthorized(): never {
    throw new UnauthorizedException('JWT token is invalid or expired');
  }
}
