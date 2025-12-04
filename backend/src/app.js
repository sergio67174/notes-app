import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { boardRouter } from "./routes/board.routes.js";
import { taskRouter } from "./routes/task.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/me", boardRouter);
app.use("/tasks", taskRouter);

app.use(errorHandler);

export { app };
