import { Router } from "express";
import { registerController, loginController } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
