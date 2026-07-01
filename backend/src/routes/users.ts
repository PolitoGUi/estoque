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
      createdBy: { select: { name: true } },
      permissions: { include: { permission: true } },
      _count: {
        select: { events: true, observations: true }
      }
    }
  });
  
  // Flatten permissions for frontend ease
  const mappedUsers = users.map(u => ({
    ...u,
    permissions: u.permissions.map(up => up.permission.name)
  }));
  
  res.json(mappedUsers);
});

router.post('/', async (req: AuthRequest, res) => {
  const { name, email, password, initials, roleId, forcePasswordChange, permissions } = req.body;
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already in use' });

  // Resolve permission IDs from names
  const permissionIds = [];
  if (Array.isArray(permissions) && permissions.length > 0) {
    const perms = await prisma.permission.findMany({ where: { name: { in: permissions } } });
    permissionIds.push(...perms.map(p => p.id));
  }

  const user = await prisma.user.create({
    data: {
      name, email, password, initials, roleId: Number(roleId),
      forcePasswordChange: Boolean(forcePasswordChange),
      createdById: req.user?.id,
      permissions: {
        create: permissionIds.map(id => ({ permissionId: id }))
      }
    },
    include: { permissions: { include: { permission: true } } }
  });

  req.auditInfo = { action: 'USER_CREATE', resource: 'USER', newData: { id: user.id, email } };
  res.status(201).json({
    ...user,
    permissions: user.permissions.map(up => up.permission.name)
  });
});

router.put('/:id', async (req: AuthRequest, res) => {
  const { name, initials, roleId, isActive, forcePasswordChange, permissions } = req.body;
  const userId = Number(req.params.id);
  const data: any = { name, initials, roleId: Number(roleId), isActive };
  
  if (forcePasswordChange !== undefined) {
    data.forcePasswordChange = Boolean(forcePasswordChange);
  }

  // Update user basic data
  const user = await prisma.user.update({
    where: { id: userId },
    data
  });

  // Handle permissions update if provided
  if (Array.isArray(permissions)) {
    const perms = await prisma.permission.findMany({ where: { name: { in: permissions } } });
    const permissionIds = perms.map(p => p.id);

    // Transaction to replace permissions
    await prisma.$transaction([
      prisma.userPermission.deleteMany({ where: { userId } }),
      prisma.userPermission.createMany({
        data: permissionIds.map(pid => ({ userId, permissionId: pid }))
      })
    ]);
  }

  // Fetch updated user with permissions
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { permissions: { include: { permission: true } } }
  });

  req.auditInfo = { action: 'USER_UPDATE', resource: `USER_${userId}` };
  res.json({
    ...updatedUser,
    permissions: updatedUser?.permissions.map(up => up.permission.name)
  });
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
