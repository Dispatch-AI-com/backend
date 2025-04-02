import * as winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => {
        const now = new Date();
        const year = now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric' });
        const month = now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', month: '2-digit' });
        const day = now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit' });
        const time = now.toLocaleString('en-AU', { 
          timeZone: 'Australia/Sydney', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        });
        return `${year}/${month}/${day} ${time}`;
      }
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ level: 'error', filename: 'logs/error.log' }),
  ],
});

export { logger };
