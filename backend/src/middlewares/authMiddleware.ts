import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    roleId: number;
  };
  auditInfo?: {
    action?: string;
    resource?: string;
    oldData?: any;
    newData?: any;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: number; roleId: number };
    
    // Check if user still exists and is active
    const userExists = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!userExists || !userExists.isActive) {
      return res.status(401).json({ error: 'User is invalid or inactive. Please login again.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// RBAC Middleware
export const requirePermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const rolePerms = await prisma.rolePermission.findMany({
        where: { roleId: req.user.roleId },
        include: { permission: true }
      });

      const hasPerm = rolePerms.some(rp => rp.permission.name === permissionName);
      if (!hasPerm) {
        return res.status(403).json({ error: `Forbidden: Missing permission '${permissionName}'` });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error validating permissions' });
    }
  };
};
