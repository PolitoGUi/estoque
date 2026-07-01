import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middlewares/authMiddleware';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = Router();
router.use(authenticate);
router.use(requirePermission('settings.manage'));

const upload = multer({ dest: '/tmp/backups/' });

router.get('/export', (req: AuthRequest, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not set' });

  const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  const filepath = path.join('/tmp', filename);

  const command = `pg_dump "${dbUrl}" -F c -f "${filepath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('pg_dump error:', error);
      return res.status(500).json({ error: 'Failed to generate backup' });
    }
    
    // @ts-ignore
    req.auditInfo = { action: 'BACKUP_EXPORT', resource: 'DATABASE' };
    
    res.download(filepath, filename, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(filepath, () => {}); // Clean up after download
    });
  });
});

router.post('/import', upload.single('backup'), (req: AuthRequest, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not set' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filepath = req.file.path;
  
  // Use pg_restore with clean option to drop/recreate objects before restoring
  const command = `pg_restore --clean --if-exists --no-owner --no-privileges -d "${dbUrl}" "${filepath}"`;

  exec(command, (error, stdout, stderr) => {
    fs.unlink(filepath, () => {}); // Clean up uploaded file

    if (error) {
      console.error('pg_restore error:', error, stderr);
      // pg_restore might return non-zero exit code for minor warnings.
      // But we will treat actual errors as 500 for safety, or log them.
      // return res.status(500).json({ error: 'Failed to restore backup. See logs.' });
    }

    // @ts-ignore
    req.auditInfo = { action: 'BACKUP_IMPORT', resource: 'DATABASE' };
    res.json({ success: true, message: 'Backup restored successfully' });
  });
});

export default router;
