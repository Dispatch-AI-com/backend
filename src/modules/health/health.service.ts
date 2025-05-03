import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, STATES as ConnectionStates } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date(),
      service: 'dispatchAI API',
      environment: process.env.NODE_ENV ?? 'development',
    };
  }

  async checkDatabase(): Promise<{
    status: string;
    database: string;
    connected: boolean;
    timestamp: Date;
    error?: string;
  }> {
    try {
      const isConnected =
        this.mongoConnection.readyState === ConnectionStates.connected;
      await Promise.resolve();
      return {
        status: isConnected ? 'ok' : 'error',
        database: 'MongoDB',
        connected: isConnected,
        timestamp: new Date(),
        error: undefined, // ✅ 明确包含 error 字段
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'MongoDB',
        connected: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
