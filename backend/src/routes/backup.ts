import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../prismaClient';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';

const router = Router();
router.use(authenticate);
router.use(requirePermission('settings.manage'));

const backupDir = path.join(os.tmpdir(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const upload = multer({ dest: backupDir });

const MODELS = [
  'Role', 'Permission', 'RolePermission', 'User', 'UserPermission',
  'SystemSetting', 'Category', 'Manufacturer', 'EquipmentModel',
  'Location', 'Equipment', 'Event', 'Observation', 'AuditLog',
  'Favorite', 'Issue', 'Notification'
];

router.get('/export', async (req: AuthRequest, res) => {
  try {
    const backupData: Record<string, any[]> = {};
    
    // Fetch all data dynamically via Prisma
    for (const model of MODELS) {
      const delegate = (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
      if (delegate && delegate.findMany) {
        backupData[model] = await delegate.findMany();
      }
    }

    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(os.tmpdir(), filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    // @ts-ignore
    req.auditInfo = { action: 'BACKUP_EXPORT', resource: 'DATABASE' };
    
    res.download(filepath, filename, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(filepath, () => {}); // Clean up after download
    });
  } catch (error: any) {
    console.error('JSON backup export error:', error);
    res.status(500).json({ error: `Failed to generate JSON backup: ${error.message}` });
  }
});

router.post('/import', upload.single('backup'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filepath = req.file.path;
  
  try {
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const backupData = JSON.parse(fileContent);
    
    // Perform import sequentially (transactions can timeout on Neon/PgBouncer)
    // 1. Delete all existing data (in reverse order to respect foreign keys)
    const reverseModels = [...MODELS].reverse();
    for (const model of reverseModels) {
      const delegate = (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
      if (delegate && delegate.deleteMany) {
        await delegate.deleteMany({});
      }
    }
    
    // 2. Insert new data
    for (const model of MODELS) {
      const data = backupData[model];
      if (data && data.length > 0) {
        const delegate = (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
        if (delegate && delegate.createMany) {
          await delegate.createMany({ data });
        }
      }
    }

    fs.unlink(filepath, () => {}); // Clean up uploaded file

    // @ts-ignore
    req.auditInfo = { action: 'BACKUP_IMPORT', resource: 'DATABASE' };
    res.json({ success: true, message: 'Backup JSON restored successfully' });
  } catch (error: any) {
    fs.unlink(filepath, () => {});
    console.error('JSON backup restore error:', error);
    res.status(500).json({ error: `Failed to restore JSON backup: ${error.message}` });
  }
});

export default router;
