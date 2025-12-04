import { Router } from "express";

export const taskRouter = Router();

taskRouter.post("/", (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});
