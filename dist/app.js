"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("./app/routes/index"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
// IMPORTANT: Webhook route MUST be registered BEFORE express.json()
// Stripe requires raw body for signature verification
app.use("/api/payments/webhook", express_1.default.raw({ type: "application/json" }));
// Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://selling-porfolio-design-frontend.vercel.app",
    ], // Specify your frontend URLs
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
    ],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}));
app.use((0, morgan_1.default)("dev"));
// Catch invalid JSON
const jsonErrorHandler = (err, _req, res, 
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
_next) => {
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
app.use("/api", index_1.default);
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "OK",
        message: "API is healthy and running!😊 you can go with rest of the routes.😉",
    });
});
// Global error handler
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "An unexpected error occurred! This is a Server Error.",
        error: err.message,
    });
});
// Not found handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        errorDetails: { path: req.originalUrl, method: req.method },
    });
});
exports.default = app;
