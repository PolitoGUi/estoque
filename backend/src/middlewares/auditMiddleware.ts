import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import prisma from '../prismaClient';

export const auditMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  // Intercept the response to log after successful completion
  res.json = function (body) {
    res.json = originalJson; // Restore

    // Only log successful modifying requests or explicitly audited ones
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (req.auditInfo || ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        
        let action = req.auditInfo?.action;
        if (!action) {
          if (req.method === 'POST') action = 'CREATE';
          if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
          if (req.method === 'DELETE') action = 'DELETE';
        }

        const resource = req.auditInfo?.resource || req.baseUrl || req.path;
        
        // Exclude passwords from logs
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '***';
        if (safeBody.newPassword) safeBody.newPassword = '***';

        const newData = req.auditInfo?.newData !== undefined ? req.auditInfo.newData : (req.method !== 'DELETE' ? safeBody : null);
        const oldData = req.auditInfo?.oldData || null;

        prisma.auditLog.create({
          data: {
            userId: req.user?.id || null,
            action: action || 'UNKNOWN',
            resource: resource,
            oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
            newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
            ip: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
          }
        }).catch(err => console.error("Erro no AuditLog:", err));
      }
    }

    return res.json(body);
  };

  next();
};
