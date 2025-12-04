import {
  findBoardByOwnerId,
  getColumnsByBoardId,
  getActiveTasksByBoardId,
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
