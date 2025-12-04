import { findUserByEmail, createUser } from "../repositories/user.repository.js";
import { createBoardForUser } from "../repositories/board.repository.js";
import { createDefaultColumnsForBoard } from "../repositories/column.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

export async function registerUser({ email, password, name }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, name });

  const board = await createBoardForUser({ ownerId: user.id });
  await createDefaultColumnsForBoard(board.id);

  return user;
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = signToken({ userId: user.id });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}
