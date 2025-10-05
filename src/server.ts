import app from "./app";
import config from "./app/config/index";
import connectDB from "./app/config/database";

const port = config.port || 5000;

// Connect to database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the Express server
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
