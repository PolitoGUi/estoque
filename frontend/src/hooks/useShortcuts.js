import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useShortcuts = (handlers) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent triggering shortcuts when typing in inputs/textareas,
      // UNLESS it's a specific global modifier like Ctrl
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      if (e.key === 'Escape') {
        if (handlers.onEscape) handlers.onEscape(e);
      }

      if (e.ctrlKey) {
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (handlers.onSearch) handlers.onSearch(e);
        }
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (handlers.onNew) handlers.onNew(e);
        }
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          if (handlers.onMove) handlers.onMove(e);
        }
      }

      // 'f' or 'F' without Ctrl, but only if not typing in an input
      if (!isInput && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (handlers.onFavorite) handlers.onFavorite(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, navigate, location]);
};
