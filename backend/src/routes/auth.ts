import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!user || user.password !== password || !user.isActive) {
    // @ts-ignore
    req.auditInfo = { action: 'LOGIN_FAILED', resource: email };
    return res.status(401).json({ error: 'Invalid credentials or inactive user' });
  }

  // Update lastLogin
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  const token = jwt.sign(
    { id: user.id, roleId: user.roleId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '8h' }
  );

  // @ts-ignore
  req.auditInfo = { action: 'LOGIN_SUCCESS', resource: `USER_${user.id}` };
  
  res.json({
    token,
    user: { 
      id: user.id, 
      name: user.name, 
      initials: user.initials, 
      role: user.role.name,
      forcePasswordChange: user.forcePasswordChange
    }
  });
});

router.post('/change-password', authenticate, async (req: any, res: any) => {
  const { oldPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (!user.forcePasswordChange) {
    if (user.password !== oldPassword) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: newPassword, forcePasswordChange: false }
  });

  req.auditInfo = { action: 'PASSWORD_CHANGE', resource: `USER_${user.id}` };
  res.json({ success: true });
});

export default router;
