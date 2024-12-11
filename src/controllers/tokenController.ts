import { Request, Response } from 'express';
import { refreshSession, deactivateSessionById } from '../services/sessionsService';
import { MESSAGES } from '../messages';

export const refreshAccessToken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const refreshToken = authHeader && authHeader.split(' ')[1];

  if (!refreshToken) {
    return res.status(401).json({ message: MESSAGES.AUTH.REFRESH_TOKEN_MISSING });
  }

  try {
    const newAccessToken = await refreshSession(refreshToken, req);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: MESSAGES.SESSION.EXPIRED_REFRESH_TOKEN });
  }
};

export const deactivateSessionsById = async (req: Request, res: Response) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: MESSAGES.SESSION.MISSING_SESSION_ID });
  }

  try {
    await deactivateSessionById(sessionId);
    res.status(200).json({ message: MESSAGES.SESSION.LOGOUT_SUCCESS });
  } catch (error) {
    res.status(500).json({ message: MESSAGES.AUTH.FAILED_LOGOUT });
  }
};
