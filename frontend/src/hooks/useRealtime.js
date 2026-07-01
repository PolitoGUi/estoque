import { useEffect } from 'react';
import api from '../api';

export const useRealtime = (onRefresh) => {
  useEffect(() => {
    // Get the base API URL correctly depending on the environment
    const apiURL = import.meta.env.VITE_API_URL || '/api';
    const sseURL = `${apiURL.replace(/\/$/, '')}/stream`;
    
    // We need to attach the token if possible, but EventSource doesn't support headers directly.
    // Instead, we can pass it as a query param if the backend supports it, OR rely on cookies.
    // Since we use Bearer tokens, we'll pass it in the query string.
    const token = localStorage.getItem('token');
    
    if (!token) return;

    const eventSource = new EventSource(`${sseURL}?token=${token}`);

    eventSource.onmessage = (e) => {
      if (e.data === 'refresh') {
        onRefresh();
      }
    };

    eventSource.onerror = (e) => {
      console.error('SSE Error:', e);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [onRefresh]);
};
