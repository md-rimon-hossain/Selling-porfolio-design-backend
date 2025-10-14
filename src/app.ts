import express, {
  Application,
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import router from "./app/routes/index";
import morgan from "morgan";
const app: Application = express();

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // Specify your frontend URLs
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  }),
);

app.use(morgan("dev"));

// Catch invalid JSON
const jsonErrorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof SyntaxError && "body" in err) {
    // eslint-disable-next-line no-console
    console.error("Invalid JSON:", err.message);
    res.status(400).json({
      success: false,
      message: "Invalid JSON format. please Give the right formatted json!",
      errorIn: err.message,
    });
    return; 
  }
};

app.use(jsonErrorHandler);

app.use("/api", router);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    success:true, 
    status: "OK",
    message: "API is healthy and running!😊 you can go with rest of the routes.😉",
  });
});

// Global error handler
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
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
