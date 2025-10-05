import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

interface ValidationError {
  field: string;
  message: string;
}

// Generic validation middleware factory
const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request against the schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map(
          (issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }),
        );

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      // Handle other types of errors
      return res.status(500).json({
        success: false,
        message: "Internal server error during validation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};

// Specific validation middleware for different request parts
export const validateBody = (schema: AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validatedData = await schema.parse({ body: req.body });
      req.body = validatedData.body;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map(
          (issue) => ({
            field: issue.path.slice(1).join("."), // Remove 'body' from path
            message: issue.message,
          }),
        );

        res.status(400).json({
          success: false,
          message: "Invalid request body",
          errors: validationErrors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error during validation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};

export const validateParams = (schema: AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validatedData = await schema.parse({ params: req.params });
      req.params = validatedData.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map(
          (issue) => ({
            field: issue.path.slice(1).join("."), // Remove 'params' from path
            message: issue.message,
          }),
        );

        res.status(400).json({
          success: false,
          message: "Invalid request parameters",
          errors: validationErrors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error during validation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validatedData = await schema.parse({ query: req.query });
      req.query = validatedData.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map(
          (issue) => ({
            field: issue.path.slice(1).join("."), // Remove 'query' from path
            message: issue.message,
          }),
        );

        res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: validationErrors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error during validation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};

export default validate;
