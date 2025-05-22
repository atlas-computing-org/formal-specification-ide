import { Request, Response } from 'express';
import { Logger } from '../Logger.ts';
import { Counter } from '@common/util/Counter.ts';
import { ErrorResponse, isErrorResponse } from '@common/serverAPI/ErrorResponse.ts';

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

export function handleRequest<Q, R>(requestHandler: RequestHandler<Q, R | ErrorResponse | void>, messagePrefix: string, requestCounter: Counter, logger: Logger) {
  return async (req: Request<{}, {}, Q>, res: Response<R | ErrorResponse>): Promise<void> => {
    const requestId = requestCounter.next();
    const requestLogger = logger.withMessagePrefix(`${messagePrefix} (${requestId}): `);

    requestLogger.info("REQUEST RECEIVED.");

    try {
      const response = await requestHandler(req, requestLogger);
      if (response === undefined) {
        requestLogger.debug("EMPTY RESPONSE");
        res.status(200).send();
      } else if (isErrorResponse(response)) {
        requestLogger.error(`REQUEST FAILED: ${response.error}`);
        res.status(400).send(response);
      } else {
        requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
        res.json(response);
      }

    } catch (e) {
      if (e instanceof RequestValidationError) {
        const error = e.message;
        requestLogger.error(`INVALID REQUEST: ${error}`);
        res.status(400).send({ error });
        return;
      }

      const error = `${e}`;
      requestLogger.error(`REQUEST FAILED: ${error}`);
      res.status(400).send({ error });
    }
  }
}