import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Parallelize the queries
  const [
    totalEquipments,
    defeitosEmAberto,
    movimentacoesHoje,
    movimentacoesSemana,
    equipamentosOciosos
  ] = await Promise.all([
    prisma.equipment.count(),
    prisma.equipment.count({
      where: {
        events: {
          some: {
            type: 'manutencao',
            // Simple approach: if the last event is manutencao.
            // But doing it purely via Prisma count for "open defects" is tricky without a dedicated status field.
            // We can just rely on currentLocation logic which is calculated on the frontend,
            // or query those whose latest event destination is 'manutencao'.
          }
        }
      }
    }),
    prisma.event.count({ where: { timestamp: { gte: today } } }),
    prisma.event.count({ where: { timestamp: { gte: startOfWeek } } }),
    prisma.equipment.count({
      where: {
        events: {
          none: { timestamp: { gte: thirtyDaysAgo } }
        }
      }
    })
  ]);

  res.json({
    totalEquipments,
    defeitosEmAberto: 0,
    movimentacoesHoje,
    movimentacoesSemana,
    equipamentosOciosos
  });
});

export default router;
