import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: number, email: string, firstname: string, lastname: string, role: string) => {
  return jwt.sign(
    { userId, email, firstname, lastname, role },
    process.env.ADMIN_JWT_SECRET!,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = (userId: number, email: string, firstname: string, lastname: string, role: string) => {
  return jwt.sign(
    { userId, email, firstname, lastname, role },
    process.env.ADMIN_REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const verifyAccessToken = (token: string) => {
  const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET!);
  return decoded;
};
export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.ADMIN_REFRESH_TOKEN_SECRET!);
};
