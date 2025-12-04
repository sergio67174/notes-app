import {
  findBoardByOwnerId,
  getColumnsByBoardId,
  getActiveTasksByBoardId,
  findDoneColumnForBoard,
  softDeleteDoneTasksForBoard,
} from "../repositories/board.repository.js";

export async function getMyBoard(userId) {
  const board = await findBoardByOwnerId(userId);
  if (!board) {
    const err = new Error("Board not found for user");
    err.status = 404;
    throw err;
  }

  const [columns, tasks] = await Promise.all([
    getColumnsByBoardId(board.id),
    getActiveTasksByBoardId(board.id),
  ]);

  return {
    board: {
      ...board,
      columns,
      tasks,
    },
  };
}

export async function removeDoneTasksForMyBoard(userId) {
  const board = await findBoardByOwnerId(userId);
  if (!board) {
    const err = new Error("Board not found for user");
    err.status = 404;
    throw err;
  }

  const doneColumn = await findDoneColumnForBoard(board.id);
  if (!doneColumn) {
    const err = new Error("DONE column not found");
    err.status = 404;
    throw err;
  }

  const removedCount = await softDeleteDoneTasksForBoard(board.id, doneColumn.id);

  return { removedCount };
}
