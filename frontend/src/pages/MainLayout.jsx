import React, { useState, useEffect, useRef } from 'react';
import { Home, Package, MapPin, QrCode, Shield, FileText, Settings, Search, Users, User, Wrench, Bell, Check, Trash2, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { fmtDate } from '../utils/helpers';

import { useShortcuts } from '../hooks/useShortcuts';

const NAV = [
  { k: "dashboard", l: "Painel Geral",    Icon: Home },
  { k: "list",      l: "Equipamentos",    Icon: Package },
  { k: "location",  l: "Por Localização", Icon: MapPin },
];

export const MainLayout = ({ view, setView, setSelEq, children }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const searchInputRef = React.useRef(null);
  
  const activeNav = view === "detail" ? "list" : view;
  const isAdmin = user?.role === 'Administrador' || user?.role?.name === 'Administrador';

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifs();
      const t = setInterval(loadNotifs, 30000); // Check every 30s
      return () => clearInterval(t);
    }
  }, [user]);

  useEffect(() => {
    const clickOut = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const loadNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifs((res.data || []).filter(n => !n.isRead));
    } catch (e) {
      // silent
    }
  };

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifs(n => n.filter(x => x.id !== id));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifs([]);
      setShowNotifs(false);
    } catch (e) {}
  };

  useShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    // Outros atalhos serão implementados nos componentes específicos ou via Context se necessário,
    // mas a busca global faz sentido ficar aqui.
  });

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    navigate(`/?view=list&q=${encodeURIComponent(val.trim())}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleSearchChange(searchTerm);
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden relative">
      <aside className="hidden md:flex w-56 bg-slate-900 flex-col shrink-0 text-white shadow-xl z-20">
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="text-2xl font-bold leading-tight">
            Asset<span className="text-amber-500">Track</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Industrial V3</div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto sidebar-scroll">
          {NAV.map(n => (
            <button key={n.k} onClick={() => { 
                navigate(`/?view=${n.k}`);
                if (setView && setSelEq) {
                  setView(n.k); setSelEq(null); 
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                activeNav === n.k
                  ? "bg-amber-500 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              <n.Icon size={18}/>{n.l}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-800">


            {hasPermission('reports.export') && (
              <button onClick={() => navigate('/reports')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors mt-1 ${activeNav === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Package size={18} className="text-blue-500" /> Relatórios
              </button>
            )}
            
            {isAdmin && (
              <>
                <button onClick={() => navigate('/audit')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors mt-1 ${activeNav === 'audit' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <FileText size={18} className="text-orange-500" /> Logs
                </button>
                <button onClick={() => navigate('/admin')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors mt-1 ${activeNav === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <Users size={18} className="text-emerald-500" /> Usuários
                </button>
                <button onClick={() => navigate('/settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors mt-1 ${activeNav === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <Settings size={18} className="text-gray-400" /> Configurações
                </button>
              </>
            )}

            <button onClick={() => setShowPwaModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors mt-1 text-slate-400 hover:text-white hover:bg-slate-800">
              <Download size={18} className="text-pink-500" /> Instalar App
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm border border-slate-600 shadow-inner">
              {user?.initials || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{user?.name}</div>
              <div className="text-xs text-amber-500 font-semibold capitalize truncate">{user?.role?.name || user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white flex items-center justify-center bg-slate-800 hover:bg-slate-700 py-2 rounded-lg font-semibold w-full transition-colors">
            Sair do sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative pb-[64px] md:pb-0">
        <header className="h-16 bg-slate-900 md:bg-white border-b border-slate-800 md:border-gray-200 flex items-center px-4 md:px-6 justify-between shrink-0 shadow-sm z-10">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-[400px] md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Pesquisa Global..." 
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white md:bg-slate-100 md:text-slate-900 border-transparent rounded-lg text-sm focus:bg-slate-700 md:focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none placeholder:text-slate-500"
            />
          </form>
          <div className="flex items-center gap-2 md:gap-4 text-sm font-semibold text-slate-600 ml-2 md:ml-4 relative" ref={notifRef}>
            <button onClick={() => setShowPwaModal(true)} className="md:hidden relative p-2 text-pink-500 hover:bg-pink-50 rounded-full transition-colors animate-pulse">
              <Download size={20} />
            </button>
            
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-50 rounded-full transition-colors">
              <Bell size={20} />
              {notifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </button>
            
            {showNotifs && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                  <h4 className="font-bold text-slate-700">Notificações</h4>
                  {notifs.length > 0 && (
                    <button onClick={markAllRead} className="text-[11px] font-bold text-slate-400 hover:text-emerald-500 uppercase tracking-wider">Ler Tudo</button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">Nenhuma notificação nova.</div>
                  ) : (
                    notifs.map(n => (
                      <div key={n.id} className="p-3 border-b border-gray-50 hover:bg-slate-50 transition-colors flex gap-3 items-start group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 font-medium leading-snug">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{fmtDate(n.createdAt)}</span>
                        </div>
                        <button onClick={() => markRead(n.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-emerald-500 transition-opacity">
                          <Check size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex items-center justify-around h-[68px] z-50 pb-safe px-2">
        <button onClick={() => navigate('/?view=dashboard')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeNav === 'dashboard' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}>
          <Home size={24} />
          <span className="text-[10px] font-bold mt-1">Início</span>
        </button>
        <button onClick={() => navigate('/?view=list')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeNav === 'list' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}>
          <Package size={24} />
          <span className="text-[10px] font-bold mt-1">Ativos</span>
        </button>
        <button onClick={() => navigate('/scanner')} className={`flex flex-col items-center justify-center w-full h-full transition-colors text-slate-400 hover:text-slate-200`}>
          <div className="p-1.5 bg-slate-800 rounded-full mb-0.5">
            <QrCode size={20} className="text-amber-500" />
          </div>
          <span className="text-[10px] font-bold">Scanner</span>
        </button>
        <button onClick={() => navigate('/?view=profile')} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeNav === 'profile' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}>
          <User size={24} />
          <span className="text-[10px] font-bold mt-1">Perfil</span>
        </button>
      </nav>

      {/* PWA Install Modal */}
      {showPwaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center mb-4">
                <Download size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Instalar Aplicativo (PWA)</h3>
              <p className="text-sm text-slate-600 mb-6">
                Para ter uma experiência nativa, sem barras de navegação e com acesso direto da tela inicial:
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">🍎 No iPhone (Safari)</h4>
                  <p className="text-xs text-slate-600">
                    Toque no botão <span className="font-bold border border-slate-300 rounded px-1">Compartilhar</span> na barra inferior do Safari e selecione 
                    <strong className="text-slate-800"> "Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">🤖 No Android (Chrome)</h4>
                  <p className="text-xs text-slate-600">
                    Geralmente um banner automático aparece no rodapé. Caso não apareça, toque nos <span className="font-bold">3 pontinhos</span> no topo direito e escolha 
                    <strong className="text-slate-800"> "Adicionar à Tela Inicial"</strong>.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button onClick={() => setShowPwaModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
