import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Key, LogOut, Users, Settings, FileText, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Profile = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isAdmin = user?.role === 'Administrador' || user?.role?.name === 'Administrador';

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-amber-500/30 border-4 border-white">
          {user?.initials || 'U'}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{user?.name}</h2>
          <p className="text-sm font-semibold text-slate-500">{user?.email}</p>
          <div className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
            {user?.role?.name || user?.role}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Minha Conta</h3>
        <button 
          onClick={() => toast.error('A alteração de senha será implementada em breve!')}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-slate-700 font-semibold"
        >
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Key size={20} />
          </div>
          Alterar Senha
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-red-600 font-semibold"
        >
          <div className="p-2 bg-red-50 text-red-600 rounded-xl">
            <LogOut size={20} />
          </div>
          Sair do Sistema
        </button>
      </div>

      {(isAdmin || hasPermission('users.manage') || hasPermission('settings.manage') || hasPermission('reports.audit')) && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
            <Shield size={14}/> Administração
          </h3>
          
          {hasPermission('users.manage') && (
            <button onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-md hover:bg-slate-800 transition-all active:scale-95 font-semibold"
            >
              <div className="p-2 bg-white/10 text-white rounded-xl">
                <Users size={20} />
              </div>
              Gerenciar Usuários
            </button>
          )}

          {hasPermission('settings.manage') && (
            <button onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-md hover:bg-slate-800 transition-all active:scale-95 font-semibold"
            >
              <div className="p-2 bg-white/10 text-white rounded-xl">
                <Settings size={20} />
              </div>
              Configurações do Sistema
            </button>
          )}

          {hasPermission('reports.audit') && (
            <button onClick={() => navigate('/audit')}
              className="w-full flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-md hover:bg-slate-800 transition-all active:scale-95 font-semibold"
            >
              <div className="p-2 bg-white/10 text-white rounded-xl">
                <FileText size={20} />
              </div>
              Auditoria e Logs
            </button>
          )}
        </div>
      )}
    </div>
  );
};
