import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';

const router = Router();
router.use(authenticate);

// Public settings for all authenticated users (dropdowns etc)
router.get('/taxonomy', async (req, res) => {
  const [categories, manufacturers, models, locations] = await Promise.all([
    prisma.category.findMany(),
    prisma.manufacturer.findMany(),
    prisma.equipmentModel.findMany(),
    prisma.location.findMany()
  ]);
  res.json({ categories, manufacturers, models, locations });
});

router.get('/system', async (req, res) => {
  const settings = await prisma.systemSetting.findMany();
  res.json(settings);
});

// Admin-only endpoints below
router.use(requirePermission('settings.manage'));

router.post('/system', async (req, res) => {
  const { key, value } = req.body;
  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
  // @ts-ignore
  req.auditInfo = { action: 'SETTING_UPDATE', resource: `SETTING_${key}` };
  res.json(setting);
});

const createCrud = (entityName: string, prismaModel: any) => {
  const r = Router();
  r.post('/', async (req, res) => {
    const data = req.body;
    const record = await prismaModel.create({ data });
    // @ts-ignore
    req.auditInfo = { action: `${entityName.toUpperCase()}_CREATE`, resource: `${entityName.toUpperCase()}_${record.id || record.key}` };
    res.status(201).json(record);
  });
  r.put('/:id', async (req, res) => {
    const data = req.body;
    const isStringId = entityName === 'Location';
    const id = isStringId ? req.params.id : Number(req.params.id);
    const where = isStringId ? { key: id } : { id };
    const record = await prismaModel.update({ where, data });
    // @ts-ignore
    req.auditInfo = { action: `${entityName.toUpperCase()}_UPDATE`, resource: `${entityName.toUpperCase()}_${id}` };
    res.json(record);
  });
  r.delete('/:id', async (req, res) => {
    const isStringId = entityName === 'Location';
    const id = isStringId ? req.params.id : Number(req.params.id);
    const where = isStringId ? { key: id } : { id };
    await prismaModel.delete({ where });
    // @ts-ignore
    req.auditInfo = { action: `${entityName.toUpperCase()}_DELETE`, resource: `${entityName.toUpperCase()}_${id}` };
    res.status(204).send();
  });
  return r;
};

router.use('/categories', createCrud('Category', prisma.category));
router.use('/manufacturers', createCrud('Manufacturer', prisma.manufacturer));
router.use('/models', createCrud('EquipmentModel', prisma.equipmentModel));
router.use('/locations', createCrud('Location', prisma.location));

export default router;
