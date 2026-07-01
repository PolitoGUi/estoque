import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();

router.use(authenticate);
router.use(requirePermission('users.manage'));

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, initials: true,
      isActive: true, lastLogin: true, createdAt: true,
      role: true,
      createdBy: { select: { name: true } }
    }
  });
  res.json(users);
});

router.post('/', async (req: AuthRequest, res) => {
  const { name, email, password, initials, roleId, forcePasswordChange } = req.body;
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already in use' });

  const user = await prisma.user.create({
    data: {
      name, email, password, initials, roleId: Number(roleId),
      forcePasswordChange: Boolean(forcePasswordChange),
      createdById: req.user?.id
    }
  });

  req.auditInfo = { action: 'USER_CREATE', resource: 'USER', newData: { id: user.id, email } };
  res.status(201).json(user);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const { name, initials, roleId, isActive, forcePasswordChange } = req.body;
  const data: any = { name, initials, roleId: Number(roleId), isActive };
  
  if (forcePasswordChange !== undefined) {
    data.forcePasswordChange = Boolean(forcePasswordChange);
  }

  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data
  });

  req.auditInfo = { action: 'USER_UPDATE', resource: `USER_${req.params.id}` };
  res.json(user);
});

router.post('/:id/reset-password', async (req: AuthRequest, res) => {
  const { password, forcePasswordChange } = req.body;
  
  await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { password, forcePasswordChange: forcePasswordChange !== undefined ? Boolean(forcePasswordChange) : true }
  });

  req.auditInfo = { action: 'USER_PASSWORD_RESET', resource: `USER_${req.params.id}` };
  res.json({ success: true });
});

export default router;
