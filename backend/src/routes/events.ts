import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

import { broadcastUpdate } from '../events/emitter';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('equipment.view'), async (req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: { name: true, initials: true }
      }
    }
  });
  res.json(events);
});

router.get('/:equipmentId', requirePermission('equipment.view'), async (req, res) => {
  const events = await prisma.event.findMany({
    where: { equipmentId: req.params.equipmentId },
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: { name: true, initials: true }
      }
    }
  });
  res.json(events);
});

router.post('/', requirePermission('equipment.move'), async (req: AuthRequest, res) => {
  const { equipmentId, type, origin, destination, notes, expectedVersion } = req.body;

  try {
    const newEvent = await prisma.$transaction(async (tx) => {
      // Optimistic Concurrency Control: check the current version
      const eq = await tx.equipment.findUnique({
        where: { id: equipmentId }
      });

      if (!eq) throw new Error('Equipment not found');
      
      // If expectedVersion is provided by the frontend, ensure it matches
      if (expectedVersion && eq.version !== expectedVersion) {
        throw new Error('Concurrency conflict: The equipment state has changed since you last viewed it.');
      }

      // Blockade: Ensure only FUNCIONAL equipment can go to campo
      if (destination === 'campo' && eq.status !== 'FUNCIONAL') {
        throw new Error(`Equipamento bloqueado. Apenas equipamentos com status FUNCIONAL podem ser enviados a campo. (Status atual: ${eq.status})`);
      }

      // Update version to prevent concurrent modifications on the same equipment
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { version: { increment: 1 } }
      });

      // Insert event
      const event = await tx.event.create({
        data: {
          equipmentId,
          type,
          origin,
          destination,
          userId: Number(req.user!.id),
          notes
        },
        include: { user: { select: { name: true, initials: true } } }
      });

      return event;
    });

    // Notify admins if sent to lab
    if (destination === 'laboratorio' || destination === 'laboratório') {
      const { notifyAdmins } = require('../utils/notify');
      await notifyAdmins(`O equipamento ${equipmentId} foi enviado para o Laboratório.`);
    }

    broadcastUpdate('refresh');
    res.status(201).json(newEvent);
  } catch (error: any) {
    if (error.message.includes('Concurrency conflict')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

export default router;
