import React, { useState } from 'react';
import { Home, Package, MapPin, QrCode, Shield, FileText, Settings, Search, Users, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { useShortcuts } from '../hooks/useShortcuts';

const NAV = [
  { k: "dashboard", l: "Painel Geral",    Icon: Home },
  { k: "list",      l: "Equipamentos",    Icon: Package },
  { k: "location",  l: "Por Localização", Icon: MapPin },
];

export const MainLayout = ({ view, setView, setSelEq, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = React.useRef(null);
  
  const activeNav = view === "detail" ? "list" : view;
  const isAdmin = user?.role === 'Administrador' || user?.role?.name === 'Administrador';

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
            <button onClick={() => navigate('/scanner')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${activeNav === 'scanner' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <QrCode size={18} className="text-amber-500" /> Scanner
            </button>

            <button onClick={() => navigate('/issues')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors mt-1 ${activeNav === 'issues' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Wrench size={18} className="text-orange-500" /> Pendências
            </button>

            <button onClick={() => navigate('/reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors mt-1 ${activeNav === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Package size={18} className="text-blue-500" /> Relatórios
            </button>
            
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
          <button onClick={logout} className="text-xs text-slate-400 hover:text-white flex items-center justify-center bg-slate-800 hover:bg-slate-700 py-2 rounded-lg font-semibold w-full transition-colors">
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
          <div className="hidden md:flex items-center gap-4 text-sm font-semibold text-slate-600 ml-4">
            {/* Any extra header icons can go here */}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only - Amber Solid Theme) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-amber-500 shadow-xl shadow-amber-500/30 rounded-2xl flex items-center justify-around h-[68px] z-30 pb-safe px-2 overflow-visible">
        <button onClick={() => navigate('/?view=dashboard')} className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-95 ${activeNav === 'dashboard' ? 'text-white scale-105' : 'text-amber-100 hover:text-white'}`}>
          <Home size={22} className={activeNav === 'dashboard' ? 'drop-shadow-md' : ''}/>
          <span className="text-[10px] font-bold mt-1">Início</span>
        </button>
        <button onClick={() => navigate('/?view=list')} className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-95 ${activeNav === 'list' ? 'text-white scale-105' : 'text-amber-100 hover:text-white'}`}>
          <Package size={22} className={activeNav === 'list' ? 'drop-shadow-md' : ''}/>
          <span className="text-[10px] font-bold mt-1">Ativos</span>
        </button>
        
        {/* Scanner Protagonista (Floating Glow) - White button on amber background */}
        <div className="relative w-full h-full flex justify-center z-40">
          <button onClick={() => navigate('/scanner')} className="absolute -top-6 bg-white hover:bg-slate-50 text-amber-500 p-3.5 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.15)] border-4 border-amber-500 transition-transform active:scale-90 glow-pulse">
            <QrCode size={26} className="drop-shadow-sm" />
          </button>
          <span className="absolute bottom-2 text-[10px] font-bold text-amber-50">Scanner</span>
        </div>

        <button onClick={() => navigate('/reports')} className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-95 ${activeNav === 'reports' ? 'text-white scale-105' : 'text-amber-100 hover:text-white'}`}>
          <FileText size={22} className={activeNav === 'reports' ? 'drop-shadow-md' : ''}/>
          <span className="text-[10px] font-bold mt-1">Relat.</span>
        </button>
        <button onClick={logout} className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-95 text-amber-100 hover:text-white`}>
          <Users size={22} />
          <span className="text-[10px] font-bold mt-1">Sair</span>
        </button>
      </nav>
    </div>
  );
};
