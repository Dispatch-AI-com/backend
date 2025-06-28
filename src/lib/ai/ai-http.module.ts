// src/lib/ai/ai-http.module.ts
import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import http from 'http';

@Global()
@Module({
  imports: [
    HttpModule.register({
      baseURL: process.env.AI_URL ?? 'http://dispatchai-ai:8000/api',
      timeout: 60_000,
      httpAgent: new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 120_000,
        maxSockets: Infinity,
      }),
    }),
  ],
  exports: [HttpModule],
})
export class AiHttpModule {}
