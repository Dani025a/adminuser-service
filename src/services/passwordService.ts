import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../models';
import { MESSAGES } from '../messages';
import { publishResetPasswordMessage } from '../rabbitmq/resetPasswordPublisher';

export const requestPasswordResetService = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(MESSAGES.PASSWORD.USER_NOT_FOUND);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires,
    },
  });

  await publishResetPasswordMessage(user.email, resetToken);
};

export const resetPasswordService = async (token: string, newPassword: string) => {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error(MESSAGES.PASSWORD.INVALID_OR_EXPIRED_TOKEN);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });
};
