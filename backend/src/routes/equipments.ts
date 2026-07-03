import { broadcastUpdate } from '../events/emitter';
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
            id: data.id?.trim().toUpperCase(),
            description: data.description?.trim().toUpperCase(),
            manufacturer: data.manufacturer?.trim().toUpperCase(),
            model: data.model?.trim().toUpperCase(),
            category: data.category?.trim().toUpperCase(),
            patrimony: data.patrimony ? data.patrimony.trim().toUpperCase() : null,
            serial: data.serial ? data.serial.trim().toUpperCase() : null,
            status: 'FUNCIONAL',
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
    broadcastUpdate('refresh');
    res.status(201).json(newEquipment);
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    res.status(400).json({ error: error.message || "Erro desconhecido ao cadastrar." });
  }
});


router.put('/:id', requirePermission('equipment.update'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = req.body;
  
  try {
    const oldEq = await prisma.equipment.findUnique({ where: { id } });
    if (!oldEq) return res.status(404).json({ error: "Equipment not found" });

    // Normalize incoming string fields
    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description?.trim().toUpperCase();
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer?.trim().toUpperCase();
    if (data.model !== undefined) updateData.model = data.model?.trim().toUpperCase();
    if (data.category !== undefined) updateData.category = data.category?.trim().toUpperCase();
    if (data.patrimony !== undefined) updateData.patrimony = data.patrimony ? data.patrimony.trim().toUpperCase() : null;
    if (data.serial !== undefined) updateData.serial = data.serial ? data.serial.trim().toUpperCase() : null;

    const eq = await prisma.equipment.update({
      where: { id },
      data: updateData
    });

    req.auditInfo = { action: 'EQUIPMENT_UPDATE', resource: id, oldData: oldEq, newData: eq };
    
    broadcastUpdate('refresh');
    res.json(eq);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
router.put('/:id/status', requirePermission('equipment.move'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const oldEq = await prisma.equipment.findUnique({ where: { id } });
    if (!oldEq) return res.status(404).json({ error: "Equipment not found" });

    const eq = await prisma.equipment.update({
      where: { id },
      data: { status }
    });

    // We do NOT create an event here, since status is an administrative tracking field independent of physical location moves.
    // But we audit the change.
    req.auditInfo = { action: 'EQUIPMENT_STATUS_UPDATE', resource: id, oldData: oldEq, newData: eq };
    broadcastUpdate('refresh');
    res.json(eq);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/bulk', requirePermission('equipment.move'), async (req: AuthRequest, res) => {
  const { ids, action, value } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Nenhum equipamento selecionado." });
  }

  try {
    if (action === 'status') {
      await prisma.equipment.updateMany({
        where: { id: { in: ids } },
        data: { status: value }
      });
      req.auditInfo = { action: 'EQUIPMENT_BULK_STATUS', resource: 'MULTIPLE', newData: { ids, status: value } };
    } else if (action === 'move') {
      await prisma.$transaction(async (tx) => {
      await tx.equipment.updateMany({
          where: { id: { in: ids } },
          data: { version: { increment: 1 } }
        });
        
        if (value === 'campo') {
          const equipmentsToMove = await tx.equipment.findMany({ where: { id: { in: ids } } });
          const blocked = equipmentsToMove.filter(eq => eq.status !== 'FUNCIONAL');
          if (blocked.length > 0) {
            throw new Error(`Existem equipamentos bloqueados na seleção (Status diferente de FUNCIONAL). Não é possível enviar para campo.`);
          }
        }

        const eventData = ids.map(id => ({
          equipmentId: id,
          type: 'transferencia',
          destination: value,
          userId: Number(req.user!.id),
          notes: 'Movimentação em lote'
        }));
        await tx.event.createMany({ data: eventData });
      });
      req.auditInfo = { action: 'EQUIPMENT_BULK_MOVE', resource: 'MULTIPLE', newData: { ids, destination: value } };
    }

    broadcastUpdate('refresh');
    res.json({ success: true, count: ids.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;



