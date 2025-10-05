import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // If auth is disabled, allow all requests
  if (!config.auth.enabled) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // If auth is disabled, continue
  if (!config.auth.enabled) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
      req.user = {
        id: decoded.id,
        username: decoded.username,
      };
    } catch (error) {
      // Invalid token, but we continue anyway since it's optional
    }
  }
  
  next();
}

