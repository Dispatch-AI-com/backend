import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, STATES as ConnectionStates } from 'mongoose';

import ai from '@/lib/axios';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

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
        error: undefined,
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

  async testAIConnection(): Promise<{
    status: string;
    message: string;
    timestamp: Date;
    duration?: number;
  }> {
    const performanceStart = performance.now();
    const response = await ai('/');
    console.log(response);
    return {
      status: 'ok',
      message: response.data.message,
      timestamp: new Date(),
      duration: performance.now() - performanceStart,
    };
  }
}
