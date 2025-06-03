import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, STATES as ConnectionStates } from 'mongoose';

import ai from '@/lib/axios';

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private heartbeatTimer: NodeJS.Timeout | undefined;

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  onModuleInit(): void {
    setTimeout(() => void this.sendHeartbeat(), 10_000);

    this.heartbeatTimer = setInterval(() => void this.sendHeartbeat(), 30_000);
  }

  onModuleDestroy(): void {
    clearInterval(this.heartbeatTimer);
  }

  check(): {
    status: string;
    timestamp: Date;
    service: string;
    environment: string;
  } {
    return {
      status: 'ok',
      timestamp: new Date(),
      service: 'dispatchAI API',
      environment: process.env.NODE_ENV ?? 'development',
    };
  }

  checkDatabase(): Promise<{
    status: string;
    database: string;
    connected: boolean;
    timestamp: Date;
    error?: string;
  }> {
    try {
      const isConnected =
        this.mongoConnection.readyState === ConnectionStates.connected;
      return Promise.resolve({
        status: isConnected ? 'ok' : 'error',
        database: 'MongoDB',
        connected: isConnected,
        timestamp: new Date(),
        error: undefined,
      });
    } catch (error) {
      return Promise.resolve({
        status: 'error',
        database: 'MongoDB',
        connected: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async testAIConnection(): Promise<{
    status: string;
    message: string;
    timestamp: Date;
    duration?: number;
  }> {
    const start = performance.now();
    const response = await ai('/');
    return {
      status: 'ok',
      message: response.data.message,
      timestamp: new Date(),
      duration: Math.round(performance.now() - start),
    };
  }

  async testAIChat(message: string): Promise<{
    status: string;
    response?: string;
    timestamp: Date;
    duration?: number;
    error?: string;
  }> {
    const start = performance.now();
    try {
      const response = await ai('/ai/chat', {
        method: 'POST',
        data: { message: message || '你好，你是谁' },
      });
      return {
        status: 'ok',
        response: response.data.response,
        timestamp: new Date(),
        duration: Math.round(performance.now() - start),
      };
    } catch (error) {
      return {
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null
              ? JSON.stringify(error)
              : String(error),
        timestamp: new Date(),
      };
    }
  }

  async pingAI(): Promise<{
    status: string;
    message?: string;
    timestamp: Date;
    duration?: number;
    error?: string;
  }> {
    const start = performance.now();
    try {
      const response = await ai('/health/ping', { method: 'GET' });
      return {
        status: 'ok',
        message: response.data.message,
        timestamp: new Date(),
        duration: Math.round(performance.now() - start),
      };
    } catch (error) {
      return {
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null
              ? JSON.stringify(error)
              : String(error),
        timestamp: new Date(),
      };
    }
  }

  private async sendHeartbeat(): Promise<void> {
    console.log('sendHeartbeat');
    try {
      const start = performance.now();
      const response = await ai('/health/ping', { method: 'GET' });
      const duration = Math.round(performance.now() - start);
      this.logger.verbose(
        `✅ AI 心跳成功（/health/ping），返回: ${JSON.stringify(response.data)}, 耗时: ${String(duration)}ms`,
      );
      console.log('sendHeartbeat success');
    } catch (err) {
      console.log(err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null
            ? JSON.stringify(err)
            : String(err);
      this.logger.warn(`⚠️ AI 心跳失败：${msg}`);
    }
  }
}
