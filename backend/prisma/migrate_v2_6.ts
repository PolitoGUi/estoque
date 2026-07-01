import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration for V2.6...');

  // 1. Settings
  const defaultSettings = [
    { key: 'company_name', value: 'Minha Indústria S/A' },
    { key: 'company_logo', value: '' }
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    });
  }

  // 2. Expand Permissions
  const perms = [
    'equipment.create', 'equipment.edit', 'equipment.move', 'equipment.scrap', 'equipment.view',
    'observation.create', 'reports.export', 'audit.view', 'users.manage', 'settings.manage'
  ];

  const createdPerms: Record<string, any> = {};
  for (const p of perms) {
    createdPerms[p] = await prisma.permission.upsert({
      where: { name: p },
      update: {},
      create: { name: p, description: `Permissão para ${p}` }
    });
  }

  // 3. Create / Update Roles
  const roleDefinitions = [
    { name: 'Administrador', description: 'Acesso total ao sistema', perms: perms },
    { name: 'Supervisor', description: 'Supervisão de operações', perms: ['equipment.move', 'reports.export', 'equipment.view'] },
    { name: 'Almoxarife', description: 'Gestão de almoxarifado', perms: ['equipment.create', 'equipment.move', 'equipment.view'] },
    { name: 'Laboratório', description: 'Reparos e testes', perms: ['equipment.move', 'observation.create', 'equipment.view'] },
    { name: 'Operador', description: 'Acesso para operações básicas', perms: ['equipment.move', 'equipment.view'] },
    { name: 'Somente Consulta', description: 'Apenas visualização', perms: ['equipment.view'] }
  ];

  for (const def of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: def.name },
      update: { description: def.description },
      create: { name: def.name, description: def.description }
    });

    // Clear existing permissions for this role to reset them
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    for (const p of def.perms) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: createdPerms[p].id }
      });
    }
  }

  // 4. Extract existing taxonomies from Equipment
  const equipments = await prisma.equipment.findMany();
  
  const categories = new Set(equipments.map(e => e.category).filter(Boolean));
  const manufacturers = new Set(equipments.map(e => e.manufacturer).filter(Boolean));
  const models = new Set(equipments.map(e => e.model).filter(Boolean));

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c },
      update: {},
      create: { name: c }
    });
  }

  for (const m of manufacturers) {
    await prisma.manufacturer.upsert({
      where: { name: m },
      update: {},
      create: { name: m }
    });
  }

  for (const m of models) {
    await prisma.equipmentModel.upsert({
      where: { name: m },
      update: {},
      create: { name: m }
    });
  }

  // 5. Default Locations
  const defaultLocations = [
    { key: 'almoxarifado', label: 'Almoxarifado', color: '#3b82f6' },
    { key: 'campo', label: 'Em Campo', color: '#22c55e' },
    { key: 'laboratorio', label: 'Laboratório', color: '#a855f7' },
    { key: 'sucata', label: 'Sucata', color: '#ef4444' }
  ];

  for (const loc of defaultLocations) {
    await prisma.location.upsert({
      where: { key: loc.key },
      update: { label: loc.label, color: loc.color },
      create: loc
    });
  }

  console.log('Migration V2.6 completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
