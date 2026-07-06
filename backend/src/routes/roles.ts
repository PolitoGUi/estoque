import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();

router.use(authenticate);
router.use(requirePermission('settings.manage')); // or users.manage depending on policy

router.get('/', async (req, res) => {
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } }
  });
  res.json(roles);
});

router.get('/permissions', async (req, res) => {
  const perms = await prisma.permission.findMany();
  res.json(perms);
});

router.put('/:id', async (req, res) => {
  const roleId = Number(req.params.id);
  const { name, description, permissions } = req.body;

  try {
    const updatedRole = await prisma.$transaction(async (tx) => {
      // Update basic info
      const role = await tx.role.update({
        where: { id: roleId },
        data: { name, description }
      });

      // Update permissions if provided
      if (Array.isArray(permissions)) {
        const perms = await tx.permission.findMany({ where: { name: { in: permissions } } });
        
        await tx.rolePermission.deleteMany({ where: { roleId } });
        if (perms.length > 0) {
          await tx.rolePermission.createMany({
            data: perms.map(p => ({ roleId, permissionId: p.id }))
          });
        }
      }

      return tx.role.findUnique({
        where: { id: roleId },
        include: { permissions: { include: { permission: true } } }
      });
    });

    res.json(updatedRole);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar cargo' });
  }
});

export default router;
