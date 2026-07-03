import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();
router.use(authenticate);

// Get all issues
router.get('/', async (req: AuthRequest, res) => {
  const issues = await prisma.issue.findMany({
    include: {
      equipment: true,
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(issues);
});

// Create an issue
router.post('/', async (req: AuthRequest, res) => {
  const { equipmentId, title, description, priority, deadline, assignedToId } = req.body;
  const createdById = req.user!.id;

  const issue = await prisma.issue.create({
    data: {
      equipmentId,
      title,
      description,
      priority,
      deadline: deadline ? new Date(deadline) : null,
      assignedToId: assignedToId || null,
      createdById
    }
  });

  if (assignedToId && assignedToId !== createdById) {
    await prisma.notification.create({
      data: {
        userId: assignedToId,
        message: `Nova pendência atribuída a você: ${title}`
      }
    });
  }

  res.status(201).json(issue);
});

// Update an issue
router.put('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, title, description, priority, deadline, assignedToId } = req.body;

  const existing = await prisma.issue.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const issue = await prisma.issue.update({
    where: { id },
    data: {
      status,
      title,
      description,
      priority,
      deadline: deadline ? new Date(deadline) : null,
      assignedToId: assignedToId || null,
    }
  });

  // Notify if assignment changed
  if (assignedToId && assignedToId !== existing.assignedToId && assignedToId !== req.user!.id) {
    await prisma.notification.create({
      data: {
        userId: assignedToId,
        message: `Uma pendência foi atribuída a você: ${title}`
      }
    });
  }

  res.json(issue);
});

// Update issue status specifically
router.put('/:id/status', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const existing = await prisma.issue.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const issue = await prisma.issue.update({
    where: { id },
    data: { status }
  });

  // Automação: Atualizar status do equipamento
  if (status === 'IN_PROGRESS') {
    await prisma.equipment.update({
      where: { id: existing.equipmentId },
      data: { status: 'EM_MANUTENCAO' }
    });
  } else if (status === 'RESOLVED') {
    await prisma.equipment.update({
      where: { id: existing.equipmentId },
      data: { status: 'FUNCIONAL' }
    });
    
    // Notify the user who created the issue
    if (existing.createdById !== req.user!.id) {
      await prisma.notification.create({
        data: {
          userId: existing.createdById,
          message: `Sua pendência "${existing.title}" foi resolvida e o equipamento está Funcional.`
        }
      });
    }
  }

  res.json(issue);
});

// Delete an issue
router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  await prisma.issue.delete({ where: { id } });
  res.status(204).send();
});

export default router;
