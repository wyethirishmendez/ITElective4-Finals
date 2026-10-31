import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Express's Request has no userId field; this adds one for this project.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export interface TokenPayload {
  userId: string;
}

// Protects the DATA (ProtectedRoute in the frontend only guards the screen).
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      message: "No token. Send Authorization: Bearer <token>",
    });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: "Token is invalid or has expired" });
  }
}
