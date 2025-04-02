import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

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
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async checkDatabase() {
    try {
      const isConnected = this.mongoConnection.readyState === 1;

      return {
        status: isConnected ? 'ok' : 'error',
        database: 'MongoDB',
        connected: isConnected,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'MongoDB',
        connected: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
