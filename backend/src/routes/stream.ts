import { Router, Request, Response } from 'express';
import { systemEvents } from '../events/emitter';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, (req: Request, res: Response) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Send initial ping to establish connection
  res.write('data: connected\n\n');

  const onUpdate = (message: string) => {
    res.write(`data: ${message}\n\n`);
  };

  systemEvents.on('update', onUpdate);

  // Keep connection alive with periodic pings
  const interval = setInterval(() => {
    res.write(':\n\n'); // SSE Comment to keep connection alive
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
    systemEvents.removeListener('update', onUpdate);
  });
});

export default router;
