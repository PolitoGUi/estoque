import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();
router.use(authenticate);

router.get('/:equipmentId', requirePermission('equipment.view'), async (req, res) => {
  const obs = await prisma.observation.findMany({
    where: { equipmentId: req.params.equipmentId },
    orderBy: { timestamp: 'desc' },
    include: { user: { select: { name: true, initials: true } } }
  });
  res.json(obs);
});

router.post('/', requirePermission('observation.create'), async (req: AuthRequest, res) => {
  const { equipmentId, category, text } = req.body;
  const observation = await prisma.observation.create({
    data: {
      equipmentId,
      category,
      text,
      userId: Number(req.user?.id)
    },
    include: { user: { select: { name: true, initials: true } } }
  });
  
  if (category === 'defeito') {
    const { notifyAdmins } = require('../utils/notify');
    
    // 1. Atualizar status do equipamento
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { status: 'COM_DEFEITO' }
    });

    // 2. Notificar admins
    await notifyAdmins(`O equipamento ${equipmentId} apresentou defeito.`);
  } else if (category === 'reparo') {
    const { notifyAdmins } = require('../utils/notify');
    
    // 1. Atualizar status do equipamento
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { status: 'FUNCIONAL' }
    });

    // 2. Notificar admins
    await notifyAdmins(`O equipamento ${equipmentId} foi reparado e voltou a operar.`);
  }

  req.auditInfo = { action: 'OBSERVATION_CREATE', resource: equipmentId, newData: observation };
  res.status(201).json(observation);
});

export default router;
