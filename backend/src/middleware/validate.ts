import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Esta función recibe un schema de Zod y devuelve un middleware de Express.
// Es una "higher-order function": una función que devuelve otra función.
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // result.error.errors tiene todos los errores de validación con mensajes claros
      res.status(400).json({
        error: 'Invalid request data',
        details: result.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    // Si la validación pasa, reemplazamos req.body con los datos ya validados y tipados
    req.body = result.data;
    next(); // next() le dice a Express que siga con el siguiente paso (el controller)
  };
};
