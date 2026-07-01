import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { HomeApp } from './pages/HomeApp';
import { ScannerPage } from './pages/ScannerPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditPage } from './pages/AuditPage';
import { ReportsPage } from './pages/ReportsPage';
import { Toaster, toast } from 'react-hot-toast';
import { Modal } from './components/Modal';
import api from './api';

const ForcePasswordChangeModal = () => {
  const { user, setUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user?.forcePasswordChange) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error("A senha deve ter pelo menos 6 caracteres.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { newPassword });
      toast.success("Senha alterada com sucesso!");
      
      const updatedUser = { ...user, forcePasswordChange: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao alterar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-amber-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Ação Obrigatória</h2>
        <p className="text-sm text-slate-500 mb-6">Por motivos de segurança, você precisa redefinir sua senha antes de continuar.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nova Senha</label>
            <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Nova Senha</label>
            <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 mt-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50">
            Alterar Senha e Continuar
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const { token, user } = useAuth();

  if (!token) {
    return <Login />;
  }

  return (
    <Router>
      <Toaster position="top-right" />
      {user?.forcePasswordChange && <ForcePasswordChangeModal />}
      <Routes>
        <Route path="/" element={<HomeApp />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
