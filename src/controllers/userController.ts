import { Request, Response } from 'express';
import { prisma } from '../models';
import { MESSAGES } from '../messages';

export const getOwnUserInfo = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(400).json({ message: MESSAGES.USER.MISSING_USER_ID });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        phone: true,
        status: true,
        role: true,
        sessions: {
          select: {
            id: true,
            accessTokenExpiration: true,
            refreshTokenExpiration: true,
            deviceInfo: true,
            ipAddress: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: MESSAGES.USER.NOT_FOUND });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(MESSAGES.USER.FETCH_ERROR, error);
    res.status(500).json({ message: MESSAGES.USER.FETCH_ERROR, error });
  }
};



export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const requesterRole = req.user?.role;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!targetUser) {
      return res.status(404).json({ message: MESSAGES.USER.NOT_FOUND });
    }

    if (requesterRole === 'MANAGER' && !['EMPLOYEE', 'SUPPORT'].includes(targetUser.role)) {
      return res.status(403).json({ message: MESSAGES.AUTH.UNAUTHORIZED });
    }
    if (requesterRole === 'ADMIN' && targetUser.role === 'ADMIN') {
      return res.status(403).json({ message: MESSAGES.AUTH.UNAUTHORIZED });
    }
    if (requesterRole === 'SUPER_ADMIN' && targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: MESSAGES.AUTH.UNAUTHORIZED });
    }

    await prisma.session.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: MESSAGES.USER.DELETE_SUCCESS });
  } catch (error) {
    res.status(500).json({ message: MESSAGES.USER.DELETE_ERROR, error });
  }
};



export const getUserInfo = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const requesterRole = req.user?.role;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        phone: true,
        status: true,
        role: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ message: MESSAGES.USER.NOT_FOUND });
    }

    const canViewSessions =
      (requesterRole === 'SUPER_ADMIN') ||
      (requesterRole === 'ADMIN' && ['MANAGER', 'EMPLOYEE', 'SUPPORT'].includes(targetUser.role)) ||
      (requesterRole === 'MANAGER' && ['EMPLOYEE', 'SUPPORT'].includes(targetUser.role));

    let sessions = [];
    if (canViewSessions) {
      sessions = await prisma.session.findMany({
        where: { userId: targetUser.id },
        select: {
          id: true,
          accessTokenExpiration: true,
          refreshTokenExpiration: true,
          deviceInfo: true,
          ipAddress: true,
          isActive: true,
        },
      });
    }

    res.status(200).json({ ...targetUser, sessions });
  } catch (error) {
    res.status(500).json({ message: MESSAGES.USER.FETCH_ERROR, error });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const requesterRole = req.user?.role;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        phone: true,
        status: true,
        role: true,
      },
    });

    const usersWithSessions = await Promise.all(
      users.map(async (user) => {
        const canViewSessions =
          (requesterRole === 'SUPER_ADMIN') ||
          (requesterRole === 'ADMIN' && ['MANAGER', 'EMPLOYEE', 'SUPPORT'].includes(user.role)) ||
          (requesterRole === 'MANAGER' && ['EMPLOYEE', 'SUPPORT'].includes(user.role));

        if (canViewSessions) {
          const sessions = await prisma.session.findMany({
            where: { userId: user.id },
            select: {
              id: true,
              accessTokenExpiration: true,
              refreshTokenExpiration: true,
              deviceInfo: true,
              ipAddress: true,
              isActive: true,
            },
          });
          return { ...user, sessions };
        } else {
          return { ...user, sessions: [] };
        }
      })
    );

    res.status(200).json(usersWithSessions);
  } catch (error) {
    console.error(MESSAGES.USER.FETCH_ERROR, error);
    res.status(500).json({ message: MESSAGES.USER.FETCH_ERROR, error });
  }
};
