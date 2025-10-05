import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import router from "./app/routes/index";
// import morgan from "morgan";
const app: Application = express();

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api", router);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    message: "UX/UI Designer Portfolio API is running successfully!",
  });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred! This is a Server Error.",
    error: err.message,
  });
});

// Not found handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errorDetails: { path: req.originalUrl, method: req.method },
  });
});

export default app;
