import 'winston-daily-rotate-file';

import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import type TransportStream from 'winston-transport';

const adelaideTimestamp = winston.format.timestamp({
  format: () => new Date().toLocaleString('en-AU', { timeZone: 'Australia/Adelaide' })
});

const transports: TransportStream[] = [
  new winston.transports.Console({
    level: 'info',
    format: winston.format.combine(
      adelaideTimestamp,
      nestWinstonModuleUtilities.format.nestLike('DispatchAI'),
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
        adelaideTimestamp,
        winston.format.uncolorize(),
        nestWinstonModuleUtilities.format.nestLike('DispatchAI'),
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
        adelaideTimestamp,
        winston.format.uncolorize(),
        nestWinstonModuleUtilities.format.nestLike('DispatchAI'),
      ),
    }),
  );
}

export const winstonLogger = WinstonModule.createLogger({
  transports,
});
