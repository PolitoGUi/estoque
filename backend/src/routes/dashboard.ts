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
    equipamentosOciosos,
    groupedLocs,
    groupedCats
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
    }),
    prisma.equipment.groupBy({
      by: ['currentLocation'],
      _count: { id: true }
    }),
    prisma.equipment.groupBy({
      by: ['category'],
      _count: { id: true }
    })
  ]);

  // Format the group by data for charts
  const locDistribution = groupedLocs.map(g => ({
    name: g.currentLocation || 'Desconhecido',
    value: g._count.id
  }));

  const catDistribution = groupedCats.map(g => ({
    name: g.category || 'Sem Categoria',
    value: g._count.id
  }));

  res.json({
    totalEquipments,
    defeitosEmAberto: 0, // Computed on frontend
    movimentacoesHoje,
    movimentacoesSemana,
    equipamentosOciosos,
    locDistribution,
    catDistribution
  });
});

export default router;
