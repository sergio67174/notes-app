import { createTaskForUser, moveTaskForUser, updateTaskForUser, deleteTaskForUser } from "../services/task.service.js";

/**
 * Create a new task
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
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

/**
 * Move a task to a different column
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
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

/**
 * Update task title and/or description
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function updateTaskController(req, res, next) {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({ message: "title or description is required" });
    }

    const updated = await updateTaskForUser({
      userId,
      taskId,
      title,
      description,
    });

    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a specific task (soft delete)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function deleteTaskController(req, res, next) {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const deleted = await deleteTaskForUser({ userId, taskId });

    return res.status(200).json({ message: "Task deleted successfully", task: deleted });
  } catch (err) {
    next(err);
  }
}
