import { Request, Response } from 'express';
import { Logger } from '../Logger.ts';
import { Counter } from '@common/util/Counter.ts';
import { ErrorResponse, isErrorResponse } from '@common/serverAPI/ErrorResponse.ts';
import { PerformanceMonitor, measurePerformance } from '../util/performance.ts';

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export const validateRequest = (condition: any, message: string) => {
  if (!condition) {
    throw new RequestValidationError(message);
  }
}

export interface RequestHandler<Q, R> {
  (req: Request<{}, {}, Q>, requestLogger: Logger): Promise<R>;
}

// High-performance request handler with optimization
export function handleRequest<Q, R>(
  requestHandler: RequestHandler<Q, R | ErrorResponse | void>, 
  messagePrefix: string, 
  requestCounter: Counter, 
  logger: Logger
) {
  return async (req: Request<{}, {}, Q>, res: Response<R | ErrorResponse>): Promise<void> => {
    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`${messagePrefix} (${requestId}): `);
    const monitor = PerformanceMonitor.getInstance();

    // Start performance monitoring
    monitor.startTimer(`endpoint.${messagePrefix}`);

    requestLogger.info("REQUEST RECEIVED.");

    try {
      // Use optimized request processing
      const response = await processRequest(requestHandler, req, requestLogger);
      
      // Send response efficiently
      await sendResponse(res, response, requestLogger);
      
    } catch (e) {
      // Handle errors efficiently
      await handleError(e, res, requestLogger);
    } finally {
      // End performance monitoring
      monitor.endTimer(`endpoint.${messagePrefix}`);
    }
  }
}

// Optimized request processing with error handling
@measurePerformance
async function processRequest<Q, R>(
  requestHandler: RequestHandler<Q, R | ErrorResponse | void>,
  req: Request<{}, {}, Q>,
  requestLogger: Logger
): Promise<R | ErrorResponse | void> {
  try {
    return await requestHandler(req, requestLogger);
  } catch (error) {
    requestLogger.error(`Request processing error: ${error}`);
    throw error;
  }
}

// High-performance response sending
async function sendResponse<R>(
  res: Response<R | ErrorResponse>,
  response: R | ErrorResponse | void,
  requestLogger: Logger
): Promise<void> {
  if (response === undefined) {
    requestLogger.debug("EMPTY RESPONSE");
    res.status(200).send();
  } else if (isErrorResponse(response)) {
    requestLogger.error(`REQUEST FAILED: ${response.error}`);
    res.status(400).send(response);
  } else {
    requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
    
    // Use optimized JSON serialization
    const jsonString = JSON.stringify(response);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', Buffer.byteLength(jsonString, 'utf8'));
    res.end(jsonString);
  }
}

// Efficient error handling
async function handleError(
  error: any,
  res: Response,
  requestLogger: Logger
): Promise<void> {
  if (error instanceof RequestValidationError) {
    const errorResponse = { error: error.message };
    requestLogger.error(`INVALID REQUEST: ${error.message}`);
    res.status(400).send(errorResponse);
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorResponse = { error: errorMessage };
  
  requestLogger.error(`REQUEST FAILED: ${errorMessage}`);
  res.status(400).send(errorResponse);
}

// Performance monitoring utilities
export class EndpointPerformance {
  private static readonly monitor = PerformanceMonitor.getInstance();

  static startTimer(endpoint: string): void {
    this.monitor.startTimer(endpoint);
  }

  static endTimer(endpoint: string): number {
    return this.monitor.endTimer(endpoint);
  }

  static getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    return this.monitor.getMetrics();
  }

  static getMemoryUsage(): { current: number; avg: number; peak: number } {
    return this.monitor.getMemoryUsage();
  }
}

// Request validation utilities with performance optimization
export class RequestValidator {
  private static readonly validationCache = new Map<string, boolean>();

  static validateRequired<T>(value: T, fieldName: string): T {
    if (value === undefined || value === null || value === '') {
      throw new RequestValidationError(`${fieldName} is required.`);
    }
    return value;
  }

  static validateString(value: any, fieldName: string, maxLength: number = 10000): string {
    if (typeof value !== 'string') {
      throw new RequestValidationError(`${fieldName} must be a string.`);
    }
    if (value.length > maxLength) {
      throw new RequestValidationError(`${fieldName} exceeds maximum length of ${maxLength}.`);
    }
    return value;
  }

  static validateArray(value: any, fieldName: string, maxLength: number = 1000): any[] {
    if (!Array.isArray(value)) {
      throw new RequestValidationError(`${fieldName} must be an array.`);
    }
    if (value.length > maxLength) {
      throw new RequestValidationError(`${fieldName} exceeds maximum length of ${maxLength}.`);
    }
    return value;
  }

  static validateObject(value: any, fieldName: string): object {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new RequestValidationError(`${fieldName} must be an object.`);
    }
    return value;
  }

  static validateNumber(value: any, fieldName: string, min?: number, max?: number): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new RequestValidationError(`${fieldName} must be a valid number.`);
    }
    if (min !== undefined && value < min) {
      throw new RequestValidationError(`${fieldName} must be at least ${min}.`);
    }
    if (max !== undefined && value > max) {
      throw new RequestValidationError(`${fieldName} must be at most ${max}.`);
    }
    return value;
  }

  static validateBoolean(value: any, fieldName: string): boolean {
    if (typeof value !== 'boolean') {
      throw new RequestValidationError(`${fieldName} must be a boolean.`);
    }
    return value;
  }

  // Clear validation cache
  static clearCache(): void {
    this.validationCache.clear();
  }
}