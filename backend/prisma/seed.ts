import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('Banco de dados já contém dados. Seed ignorado.');
    return;
  }

  // 1. Criar Permissões
  const perms = [
    'equipment.create', 'equipment.edit', 'equipment.move', 'equipment.scrap', 'equipment.view',
    'observation.create', 'reports.export', 'audit.view', 'users.manage', 'settings.manage'
  ];

  const createdPerms: Record<string, any> = {};
  for (const p of perms) {
    createdPerms[p] = await prisma.permission.create({
      data: { name: p, description: `Permissão para ${p}` }
    });
  }

  // 2. Criar Roles (Perfis Base)
  const adminRole = await prisma.role.create({
    data: { name: 'Administrador', description: 'Acesso total ao sistema' }
  });

  const operatorRole = await prisma.role.create({
    data: { name: 'Operador', description: 'Acesso para operações básicas' }
  });

  // Atribuir todas as permissões ao Admin
  for (const p of perms) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: createdPerms[p].id }
    });
  }

  // Atribuir permissões limitadas ao Operador
  const opPerms = ['equipment.view', 'equipment.move', 'observation.create'];
  for (const p of opPerms) {
    await prisma.rolePermission.create({
      data: { roleId: operatorRole.id, permissionId: createdPerms[p].id }
    });
  }

  // 3. Criar Usuários
  await prisma.user.create({
    data: {
      name: 'Carlos Mendes',
      email: 'admin@assettrack.com',
      password: 'admin123', // Em produção, hash bcrypt
      initials: 'CM',
      roleId: adminRole.id,
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      name: 'Ana Souza',
      email: 'operador@assettrack.com',
      password: 'operador123',
      initials: 'AS',
      roleId: operatorRole.id,
      isActive: true
    }
  });

  console.log('Seed executado com sucesso! Estrutura RBAC inicializada.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
