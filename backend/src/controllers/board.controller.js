import { getMyBoard } from "../services/board.service.js";

export async function getMyBoardController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await getMyBoard(userId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
