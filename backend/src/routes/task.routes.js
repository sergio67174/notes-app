import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createTaskController,
  moveTaskController,
  updateTaskController
} from "../controllers/task.controller.js";

export const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.post("/", createTaskController);
taskRouter.patch("/:id", updateTaskController);
taskRouter.patch("/:id/move", moveTaskController);
