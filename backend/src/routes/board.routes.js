import { Router } from "express";
import { getMyBoardController } from "../controllers/board.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const boardRouter = Router();

// everything under /me must be authenticated
boardRouter.use(authMiddleware);

boardRouter.get("/board", getMyBoardController);
