import { prisma } from '../models';

export const createUser = async (userData: any) => {
  return prisma.user.create({
    data: userData,
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};
