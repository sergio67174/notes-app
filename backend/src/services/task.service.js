import {
  findTodoColumnForUser,
  getNextPositionForColumn,
  createTask,
} from "../repositories/task.repository.js";

export async function createTaskForUser({ userId, title, description }) {
  const result = await findTodoColumnForUser(userId);

  if (!result || !result.board || !result.column) {
    const err = new Error("Board or TODO column not found for user");
    err.status = 404;
    throw err;
  }

  const { board, column } = result;

  const position = await getNextPositionForColumn(column.id);

  const task = await createTask({
    boardId: board.id,
    columnId: column.id,
    title,
    description,
    position,
  });

  return task;
}
