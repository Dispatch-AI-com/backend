import 'winston-daily-rotate-file';

import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('DispatchAI'),
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.uncolorize(),
        nestWinstonModuleUtilities.format.nestLike('DispatchAI'),
      ),
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.uncolorize(),
        nestWinstonModuleUtilities.format.nestLike('DispatchAI'),
      ),
    }),
  ],
});
