import { Request, Response } from 'express';
import { createUser, findUserByEmail } from '../services/userService';
import { createSession, deactivateSession } from '../services/sessionsService';
import bcrypt from 'bcrypt';
import { requestPasswordResetService, resetPasswordService } from '../services/passwordService';
import { MESSAGES } from '../messages';

export const register = async (req: Request, res: Response) => {
  const { email, password, firstname, lastname, role } = req.body;
  const requesterRole = req.user?.role;


  console.log("Requester role:", requesterRole); 

  try {
    if (role === 'SUPER_ADMIN' && requesterRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: MESSAGES.AUTH.UNAUTHORIZED_SUPERADMIN });
    }

    if (role === 'MANAGER' && !['ADMIN', 'SUPER_ADMIN'].includes(requesterRole)) {
      return res.status(403).json({ message: MESSAGES.AUTH.UNAUTHORIZED });
    }

    if ((role === 'EMPLOYEE' || role === 'SUPPORT') && !['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(requesterRole)) {
      return res.status(403).json({ message: MESSAGES.AUTH.UNAUTHORIZED });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      status: 'ACTIVE',
      role: role || 'EMPLOYEE',
    });

    res.status(201).json({ message: MESSAGES.USER.REGISTRATION_SUCCESS });
  } catch (error) {
    console.error("Registration error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      error.meta &&
      error.meta.target
    ) {
      if ((error.meta.target as string[]).includes('email')) {
        return res.status(400).json({ message: MESSAGES.USER.EMAIL_ALREADY_EXISTS });
      }
    }

    res.status(400).json({ message: MESSAGES.USER.REGISTRATION_FAILED, error });
  }
};



export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: MESSAGES.AUTH.INVALID_CREDENTIALS });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ message: MESSAGES.AUTH.ACCOUNT_INACTIVE });
  }
  

  const { accessToken, refreshToken } = await createSession(user.id, user.email, user.firstname, user.lastname, user.role, req);
  res.status(200).json({ accessToken, refreshToken });
};

export const logout = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const refreshToken = authHeader && authHeader.split(' ')[1];

  if (!refreshToken) {
    return res.status(401).json({ message: MESSAGES.AUTH.REFRESH_TOKEN_MISSING });
  }

  try {
    await deactivateSession(refreshToken);
    res.status(200).json({ message: MESSAGES.SESSION.LOGOUT_SUCCESS });
  } catch (error) {
    res.status(500).json({ message: MESSAGES.AUTH.FAILED_LOGOUT });
  }
};


export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    await requestPasswordResetService(email);
    res.status(200).json({ message: MESSAGES.PASSWORD.EMAIL_SENT });
  } catch (error) {
    res.status(500).json({ message: MESSAGES.PASSWORD.RESET_REQUEST_ERROR, error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  try {
    await resetPasswordService(token, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: MESSAGES.PASSWORD.RESET_ERROR, error });
  }
};
