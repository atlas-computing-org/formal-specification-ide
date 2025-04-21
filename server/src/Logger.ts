import winston from 'winston';
import Transport from 'winston-transport';
import { promises as fs } from 'node:fs';
import { getCurrentTimestampString } from '@common/util/timeUtils.ts';

const LOGS_DIRECTORY = './server/log';
const LOGS_DIRECTORY_NOTEBOOK= './log';
const initializationTime = getCurrentTimestampString();

// Customize log levels
const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

// Copied from winston.d.ts internal types
interface LeveledLogMethod {
  (message: string, ...meta: any[]): winston.Logger;
  (message: any): winston.Logger;
  (infoObject: object): winston.Logger;
}

// Extend winston.Logger type to include custom log levels
interface RawLogger extends winston.Logger {
  fatal: LeveledLogMethod;
  error: LeveledLogMethod;
  warn: LeveledLogMethod;
  info: LeveledLogMethod;
  debug: LeveledLogMethod;
  trace: LeveledLogMethod;
};

// Define the log format
const logFormat = winston.format.combine(
  //winston.format.errors({ stack: true }),
  //winston.format.json()),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

export interface Logger {
  fatal(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  trace(message: string): void;
  withMessagePrefix(prefix: string): Logger;
}

class LoggerWithPrefix implements Logger {
  private readonly logger: Logger;
  private readonly prefix: string;

  constructor(logger: Logger, prefix: string) {
    this.logger = logger;
    this.prefix = prefix;
  }

  fatal(message: string) {
    this.logger.fatal(this.prefix + message);
  }

  error(message: string) {
    this.logger.error(this.prefix + message);
  }

  warn(message: string) {
    this.logger.warn(this.prefix + message);
  }

  info(message: string) {
    this.logger.info(this.prefix + message);
  }

  debug(message: string) {
    this.logger.debug(this.prefix + message);
  }

  trace(message: string) {
    this.logger.trace(this.prefix + message);
  }

  withMessagePrefix(prefix: string): Logger {
    return new LoggerWithPrefix(this, prefix);
  }
}

class DefaultLogger implements Logger {
  private readonly logger: RawLogger;

  private constructor() {
    this.logger = winston.createLogger({
      levels: logLevels,
      format: logFormat,
      transports: [
        // Console logging
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), logFormat),
          level: 'info',
        }),
  
        // File logging
        new winston.transports.File({
          filename: `${LOGS_DIRECTORY}/server_${initializationTime}.log`,
          level: 'info',
        }),
  
        // File logging
        new winston.transports.File({
          filename: `${LOGS_DIRECTORY}/serverDebug_${initializationTime}.log`,
          level: 'debug',
        }),
      ],
    }) as RawLogger;
  }

  static getLogger(): Logger {
    return new DefaultLogger();
  }

  fatal(message: string) {
    this.logger.fatal(message);
  }

  error(message: string) {
    this.logger.error(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  info(message: string) {
    this.logger.info(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  trace(message: string) {
    this.logger.trace(message);
  }

  withMessagePrefix(prefix: string): Logger {
    return new LoggerWithPrefix(this, prefix);
  }
}

// Custom notebook transport
class NotebookTransport extends Transport {
  constructor(opts) {
    super(opts);
  }
  override log(info, callback) {
    console.log(info.message);
    callback();
  }
};

class NotebookLogger implements Logger {
  private readonly logger: RawLogger;

  private constructor() {
    this.logger = winston.createLogger({
      levels: logLevels,
      format: logFormat,
      transports: [ 
        new NotebookTransport({
          level: 'info'
        }),
        new winston.transports.File({
          filename: `${LOGS_DIRECTORY_NOTEBOOK}/server_${initializationTime}.log`,
          level: 'info',
        }),
        new winston.transports.File({
          filename: `${LOGS_DIRECTORY_NOTEBOOK}/serverDebug_${initializationTime}.log`,
          level: 'debug',
        }),
      ],
    }) as RawLogger;
  }

  static getNotebookLogger(): Logger {
    return new NotebookLogger();
  }

  fatal(message: string) {
    this.logger.fatal(message);
  }

  error(message: string) {
    this.logger.error(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  info(message: string) {
    this.logger.info(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  trace(message: string) {
    this.logger.trace(message);
  }

  withMessagePrefix(prefix: string): Logger {
    return new LoggerWithPrefix(this, prefix);
  }
}

export async function writeCustomLogFile(message: string, filePrefix: string) {
  const currentTime = getCurrentTimestampString();
  const fileName = `${LOGS_DIRECTORY}/${filePrefix}_${currentTime}.log`;
  await fs.mkdir(LOGS_DIRECTORY, { recursive: true });
  await fs.writeFile(fileName, message);
  return fileName;
}

export const {getLogger} = DefaultLogger;
export const {getNotebookLogger} = NotebookLogger;