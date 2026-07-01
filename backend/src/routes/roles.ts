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

// Outras rotas CRUD de Role omitidas por brevidade, mas podem ser adicionadas
// para a gestão completa de permissões via UI.

export default router;
