import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();

router.use(authenticate);
router.use(requirePermission('audit.view'));

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;
  const actionFilter = req.query.action ? String(req.query.action) : undefined;
  
  const where = actionFilter ? { action: actionFilter } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { name: true, email: true } } }
    }),
    prisma.auditLog.count({ where })
  ]);
  
  res.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
});

export default router;
