import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import authRoutes from './routes/auth';
import equipmentRoutes from './routes/equipments';
import eventRoutes from './routes/events';
import observationRoutes from './routes/observations';
import roleRoutes from './routes/roles';
import userRoutes from './routes/users';
import auditRoutes from './routes/audit';
import settingsRoutes from './routes/settings';
import backupRoutes from './routes/backup';
import { auditMiddleware } from './middlewares/auditMiddleware';

import dashboardRoutes from './routes/dashboard';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Auditoria global para as rotas /api
app.use('/api', auditMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/equipments', equipmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
