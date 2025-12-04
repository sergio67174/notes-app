import { createTaskForUser } from "../services/task.service.js";

export async function createTaskController(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    const task = await createTaskForUser({ userId, title, description });
    return res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}
