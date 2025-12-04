import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createTaskController, moveTaskController } from "../controllers/task.controller.js";

export const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.post("/", createTaskController);
taskRouter.patch("/:id/move", moveTaskController);
