import { Router } from "express";

export const boardRouter = Router();

boardRouter.get("/board", (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});
