import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth-service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        playerId: number;
        username: string;
        email: string;
        role: 'player' | 'admin';
        token: string;
      };
    }
  }
}

// Middleware to verify player authentication
export const verifyPlayer = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = AuthService.verifyJWT(token);

    if (!decoded || decoded.role !== 'player') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = {
      playerId: decoded.playerId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      token
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware to verify admin authentication
export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    const decoded = AuthService.verifyJWT(token);

    if (!decoded || decoded.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired admin token'
      });
    }

    // Attach user to request
    req.user = {
      playerId: decoded.playerId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      token
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Admin authentication failed'
    });
  }
};

// Optional auth middleware - continues even if not authenticated
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.auth_token;

    if (token) {
      const decoded = AuthService.verifyJWT(token);
      if (decoded) {
        req.user = {
          playerId: decoded.playerId,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
          token
        };
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};
