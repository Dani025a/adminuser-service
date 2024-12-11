import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { MESSAGES } from '../messages';
import { prisma } from "../models";

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: MESSAGES.AUTH.TOKEN_MISSING });
  }

  try {
    const decoded = verifyAccessToken(token);
    console.log("Decoded token:", decoded);

    const session = await prisma.session.findFirst({
      where: { accessToken: token },
    });

    if (!session) {
      return res.status(404).json({ message: MESSAGES.SESSION.SESSION_NOT_FOUND });
    }

    if (!session.isActive) {
      return res.status(403).json({ message: MESSAGES.SESSION.SESSION_INACTIVE });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT authentication error:", err);
    return res.status(403).json({ message: MESSAGES.AUTH.INVALID_ACCESS_TOKEN });
  }
};