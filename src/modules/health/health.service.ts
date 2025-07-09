import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, STATES as ConnectionStates } from 'mongoose';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly http: HttpService,
  ) {}

  onModuleInit(): void {
    setTimeout(() => void this.sendHeartbeat(), 10_000);

    this.heartbeatTimer = setInterval(() => void this.sendHeartbeat(), 30_000);
  }

  onModuleDestroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
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

  checkDatabase(): {
    status: string;
    database: string;
    connected: boolean;
    timestamp: Date;
  } {
    const ok = this.mongoConnection.readyState === ConnectionStates.connected;
    return {
      status: ok ? 'ok' : 'error',
      database: 'MongoDB',
      connected: ok,
      timestamp: new Date(),
    };
  }

  async testAIConnection(): Promise<{
    status: string;
    message: string;
    timestamp: Date;
    duration?: number;
  }> {
    const start = performance.now();
    const { data } = await firstValueFrom(
      this.http.get<{ message: string }>('/health/ping'),
    );
    return {
      status: 'ok',
      message: data.message,
      timestamp: new Date(),
      duration: Math.round(performance.now() - start),
    };
  }

  async testAIChat(
    message: string,
    callSid: string,
  ): Promise<{
    status: string;
    replyText?: string;
    timestamp: Date;
    duration?: number;
    error?: string;
  }> {
    const start = performance.now();
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ replyText: string }>('/ai/chat', {
          message: message || '你好，你是谁啊？',
          callSid,
        }),
      );
      return {
        status: 'ok',
        replyText: data.replyText,
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
      const { data } = await firstValueFrom(
        this.http.get<{ message: string }>('/health/ping'),
      );
      return {
        status: 'ok',
        message: data.message,
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
    try {
      const start = performance.now();
      const { data } = await firstValueFrom(
        this.http.get<{ message: string }>('/health/ping'),
      );
      const duration = Math.round(performance.now() - start);
      this.logger.verbose(
        `✅ AI 心跳成功（/health/ping），返回: ${JSON.stringify(data)}, 耗时: ${String(duration)}ms`,
      );
    } catch (err) {
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
