import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();
router.use(authenticate);

// Toggle favorite
router.post('/toggle', async (req: AuthRequest, res) => {
  const { equipmentId } = req.body;
  if (!equipmentId) return res.status(400).json({ error: 'equipmentId is required' });

  const userId = req.user!.userId;

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_equipmentId: { userId, equipmentId }
    }
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        userId_equipmentId: { userId, equipmentId }
      }
    });
    return res.json({ favorited: false });
  } else {
    await prisma.favorite.create({
      data: { userId, equipmentId }
    });
    return res.json({ favorited: true });
  }
});

// List favorites for current user
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      equipment: true
    }
  });
  res.json(favorites);
});

export default router;
