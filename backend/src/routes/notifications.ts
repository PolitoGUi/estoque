import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();
router.use(authenticate);

// Get my notifications
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(notifications);
});

// Mark as read
router.post('/:id/read', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true }
  });
  
  res.json({ success: true });
});

// Mark all as read
router.post('/read-all', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
  
  res.json({ success: true });
});

export default router;
