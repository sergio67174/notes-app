import { registerUser, loginUser } from "../services/auth.service.js";

export async function registerController(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "email, password and name are required" });
    }

    const user = await registerUser({ email, password, name });
    return res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const result = await loginUser({ email, password });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
