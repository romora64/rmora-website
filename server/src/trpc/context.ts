import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

export interface Context {
  req: Request;
  res: Response;
  user: JwtPayload | null;
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  let user: JwtPayload | null = null;

  const token = req.cookies?.session;
  if (token) {
    try {
      user = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    } catch {
      // token inválido o expirado — user queda null
    }
  }

  return { req, res, user };
}
