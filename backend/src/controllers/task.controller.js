import { createTaskForUser, moveTaskForUser } from "../services/task.service.js";

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

// 👉 NEW
export async function moveTaskController(req, res, next) {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { target_column_id, new_position } = req.body;

    if (!target_column_id) {
      return res.status(400).json({ message: "target_column_id is required" });
    }

    const updated = await moveTaskForUser({
      userId,
      taskId,
      targetColumnId: target_column_id,
      newPosition: new_position,
    });

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}
