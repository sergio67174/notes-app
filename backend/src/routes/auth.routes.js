import { Router } from "express";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

authRouter.post("/login", (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});
