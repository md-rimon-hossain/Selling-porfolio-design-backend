"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.validateQuery = exports.validateParams = exports.validateBody = void 0;
const zod_1 = require("zod");
// Generic validation middleware factory
const validate = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Validate the request against the schema
            yield schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
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
    });
};
// Specific validation middleware for different request parts
const validateBody = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log(req.body);
            const validatedData = yield schema.parse({ body: req.body });
            req.body = validatedData.body;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.issues.map((issue) => ({
                    field: issue.path.slice(1).join("."), // Remove 'body' from path
                    message: issue.message,
                }));
                res.status(400).json({
                    success: false,
                    message: "Invalid request body from zod ValidateBody",
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
    });
};
exports.validateBody = validateBody;
const validateParams = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const validatedData = yield schema.parse({ params: req.params });
            req.params = validatedData.params;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.issues.map((issue) => ({
                    field: issue.path.slice(1).join("."), // Remove 'params' from path
                    message: issue.message,
                }));
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
    });
};
exports.validateParams = validateParams;
const validateQuery = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const validatedData = yield schema.parse({ query: req.query });
            req.query = validatedData.query;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.issues.map((issue) => ({
                    field: issue.path.slice(1).join("."), // Remove 'query' from path
                    message: issue.message,
                }));
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
    });
};
exports.validateQuery = validateQuery;
// Generic validation for combined schemas (body + params + query)
const validateRequest = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const validatedData = yield schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (validatedData.body)
                req.body = validatedData.body;
            if (validatedData.query)
                req.query = validatedData.query;
            if (validatedData.params)
                req.params = validatedData.params;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
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
    });
};
exports.validateRequest = validateRequest;
exports.default = validate;
