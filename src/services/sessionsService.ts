import { prisma } from '../models';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { MESSAGES } from '../messages';

export const createSession = async (userId: string, email: string, firstname: string, lastname: string, role: string, req: any) => {
  try {
    const accessToken = generateAccessToken(userId, email, firstname, lastname, role);
    const refreshToken = generateRefreshToken(userId, email, firstname, lastname, role);

    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip;

    await prisma.session.create({
      data: {
        accessToken,
        refreshToken,
        refreshTokenExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        accessTokenExpiration: new Date(Date.now() + 1 * 60 * 60 * 1000),
        userId,
        deviceInfo,
        ipAddress,
        isActive: true,
      },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(MESSAGES.SESSION.FAILED_SESSION_CREATION);
  }
};

export const refreshSession = async (refreshToken: string, req: any) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const session = await prisma.session.findFirst({
      where: { refreshToken },
    });

    if (!session || !session.isActive || session.refreshTokenExpiration < new Date()) {
      throw new Error(MESSAGES.SESSION.INVALID_OR_INACTIVE);
    }

    const newAccessToken = generateAccessToken(decoded.userId, decoded.email, decoded.firstname, decoded.lastname, decoded.role);
    const newAccessTokenExpiration = new Date(Date.now() + 1 * 60 * 60 * 1000);

    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip;

    await prisma.session.update({
      where: { id: session.id },
      data: {
        accessToken: newAccessToken,
        accessTokenExpiration: newAccessTokenExpiration,
        deviceInfo,
        ipAddress,
      },
    });

    return newAccessToken;
  } catch (error) {
    throw new Error(MESSAGES.SESSION.EXPIRED_REFRESH_TOKEN);
  }
};

export const deactivateSession = async (refreshToken: string) => {
  try {
    await prisma.session.updateMany({
      where: { refreshToken },
      data: {
        isActive: false,
      },
    });
  } catch (error) {
    throw new Error(MESSAGES.SESSION.FAILED_DEACTIVATE);
  }
};

export const deactivateSessionById = async (sessionId: string) => {
  try {
    await prisma.session.updateMany({
      where: { id: sessionId },
      data: {
        isActive: false,
      },
    });
  } catch (error) {
    throw new Error(MESSAGES.SESSION.FAILED_DEACTIVATE);
  }
};

export const deactivateExpiredSessions = async () => {
  try {
    const now = new Date();

    await prisma.session.updateMany({
      where: {
        refreshTokenExpiration: { lte: now },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    console.log(MESSAGES.SESSION.SESSION_DEACTIVATED);
  } catch (error) {
    console.error(MESSAGES.SESSION.FAILED_DEACTIVATE);
  }
};
