import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { boardRouter } from "./routes/board.routes.js";
import { taskRouter } from "./routes/task.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/me", boardRouter);
app.use("/tasks", taskRouter);

app.use(errorHandler);

export { app };
