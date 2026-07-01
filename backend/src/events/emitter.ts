import { EventEmitter } from 'events';

class GlobalEmitter extends EventEmitter {}

// Singleton instance to be used across the application
export const systemEvents = new GlobalEmitter();

// Utility function to broadcast an update event
export const broadcastUpdate = (message: string = 'refresh') => {
  systemEvents.emit('update', message);
};
