import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import type { TokenPayload } from "../middleware/auth";

export const authRouter = Router();

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// POST /api/auth/register -- no role in the body, so nobody can pick one.
authRouter.post(
  "/register",
  async (req: Request<unknown, unknown, RegisterBody>, res: Response) => {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      res.status(409).json({ message: "That email is already registered" });
      return;
    }

    // The pre("save") hook in User.ts hashes the password.
    const user = await User.create({ name, email, password });
    res.status(201).json(user.toJSON());
  },
);

// POST /api/auth/login -- the only route that issues a token.
authRouter.post(
  "/login",
  async (req: Request<unknown, unknown, LoginBody>, res: Response) => {
    const { email, password } = req.body;

    // password is select: false, so ask for it back for this query.
    const user = await User.findOne({ email }).select("+password");

    // One message for both failures.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Email or password is incorrect" });
      return;
    }

    const payload: TokenPayload = { userId: String(user._id) };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "2h",
    });

    res.json({ token, user: user.toJSON() });
  },
);
