import 'winston-daily-rotate-file';

import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import type TransportStream from 'winston-transport';

const utcTimestamp = winston.format.timestamp();

const transports: TransportStream[] = [
  new winston.transports.Console({
    level: 'info',
    format: winston.format.combine(
      utcTimestamp,
      winston.format.uncolorize(),
      nestWinstonModuleUtilities.format.nestLike('DispatchAI', { colors: false }),
    ),
  }),
];

if (process.env.LOG_TO_FILE === 'true') {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      auditFile: 'logs/.combined-audit.json',
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        utcTimestamp,
        winston.format.uncolorize(),
        nestWinstonModuleUtilities.format.nestLike('DispatchAI', { colors: false }),
      ),
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      auditFile: 'logs/.error-audit.json',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxFiles: '30d',
      format: winston.format.combine(
        utcTimestamp,
        winston.format.uncolorize(),
        nestWinstonModuleUtilities.format.nestLike('DispatchAI', { colors: false }),
      ),
    }),
  );
}

export const winstonLogger = WinstonModule.createLogger({
  transports,
});
