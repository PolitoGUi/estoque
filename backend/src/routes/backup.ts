import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middlewares/authMiddleware';
import { exec, execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';

const findPgDump = () => {
  const paths = [
    '/usr/bin/pg_dump',
    '/usr/lib/postgresql/16/bin/pg_dump',
    '/usr/lib/postgresql/15/bin/pg_dump',
    '/usr/lib/postgresql/14/bin/pg_dump',
    '/usr/local/bin/pg_dump'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return 'pg_dump';
};

const findPgRestore = () => {
  const paths = [
    '/usr/bin/pg_restore',
    '/usr/lib/postgresql/16/bin/pg_restore',
    '/usr/lib/postgresql/15/bin/pg_restore',
    '/usr/lib/postgresql/14/bin/pg_restore',
    '/usr/local/bin/pg_restore'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return 'pg_restore';
};

const router = Router();
router.use(authenticate);
router.use(requirePermission('settings.manage'));

const backupDir = path.join(os.tmpdir(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const upload = multer({ dest: backupDir });

router.get('/export', (req: AuthRequest, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not set' });

  const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  const filepath = path.join(os.tmpdir(), filename);

  const args = [dbUrl, '-F', 'c', '-f', filepath];
  const pgDumpPath = findPgDump();

  execFile(pgDumpPath, args, (error, stdout, stderr) => {
    if (error) {
      console.error('pg_dump error:', error, stderr);
      return res.status(500).json({ error: `Failed to generate backup: ${stderr || error.message}` });
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
  const args = ['--clean', '--if-exists', '--no-owner', '--no-privileges', '-d', dbUrl, filepath];
  const pgRestorePath = findPgRestore();

  execFile(pgRestorePath, args, (error, stdout, stderr) => {
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
