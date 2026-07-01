import prisma from '../prismaClient';

export const notifyAdmins = async (message: string) => {
  const admins = await prisma.user.findMany({
    where: { role: { name: 'Administrador' } }
  });
  
  const notifications = admins.map(a => ({
    userId: a.id,
    message
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
};

export const notifyUser = async (userId: number, message: string) => {
  await prisma.notification.create({
    data: { userId, message }
  });
};
