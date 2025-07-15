import { Global, Module, Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';
<<<<<<< HEAD

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): Redis => {
    if (process.env.REDIS_URL != null) {
      return new Redis(process.env.REDIS_URL);
    }
=======
const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): Redis => {
>>>>>>> origin/twilio-ai-v4
    return new Redis({
      host: process.env.REDIS_HOST ?? 'redis',
      port: Number(process.env.REDIS_PORT ?? 6379),
    });
  },
};
<<<<<<< HEAD
=======

>>>>>>> origin/twilio-ai-v4
@Global()
@Module({
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}
