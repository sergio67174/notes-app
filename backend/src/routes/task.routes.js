import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createTaskController } from "../controllers/task.controller.js";

export const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.post("/", createTaskController);

// we'll add move + remove-done later here or in separate routes
