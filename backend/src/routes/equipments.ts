import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('equipment.view'), async (req, res) => {
  const equipments = await prisma.equipment.findMany({
    include: {
      events: {
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    }
  });

  // Calculate current location based on the latest event
  const formatted = equipments.map(eq => {
    const latestEvent = eq.events[0];
    return {
      ...eq,
      currentLocation: latestEvent?.destination || 'almoxarifado'
    };
  });

  res.json(formatted);
});

router.post('/', requirePermission('equipment.create'), async (req: AuthRequest, res) => {
  const data = req.body;
  try {
    const newEquipment = await prisma.$transaction(async (tx) => {
      const qrJson = JSON.stringify({ id: data.id, v: 1 });
      const eq = await tx.equipment.create({
        data: {
          id: data.id,
          description: data.description,
          manufacturer: data.manufacturer,
          model: data.model,
          category: data.category,
          patrimony: data.patrimony || null,
          serial: data.serial || null,
          qrCodeData: qrJson, // Structured JSON format for QR Code
        }
      });

      await tx.event.create({
        data: {
          equipmentId: eq.id,
          type: 'cadastro',
          destination: 'almoxarifado',
          userId: Number(req.user!.id),
          notes: data.notes || 'Cadastro inicial.'
        }
      });

      return eq;
    });

    req.auditInfo = { action: 'EQUIPMENT_CREATE', resource: newEquipment.id, newData: newEquipment };
    res.status(201).json(newEquipment);
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    res.status(400).json({ error: error.message || "Erro desconhecido ao cadastrar." });
  }
});

export default router;
