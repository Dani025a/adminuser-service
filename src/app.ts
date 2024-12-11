import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import tokenRoutes from './routes/tokenRoutes';

dotenv.config();

const app = express();

app.use(
    cors({
      origin: process.env.ADMIN_FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true, 
    })
  );

app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/token', tokenRoutes);

export default app;
