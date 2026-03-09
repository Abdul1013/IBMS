import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors[0]?.message ?? 'Validation failed';
      next({ statusCode: 400, code: 'VALIDATION_ERROR', message });
      return;
    }
    req.body = result.data;
    next();
  };
