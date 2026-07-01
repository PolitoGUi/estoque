import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@assettrack.com');
  const [password, setPassword] = useState('admin123');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      alert('Login falhou. Verifique as credenciais.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-96">
        <div className="text-2xl font-bold text-slate-800 mb-6 text-center">
          Asset<span className="text-amber-500">Track</span> V2
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-600 mb-1">E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-600 mb-1">Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" required />
        </div>
        <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2 rounded-lg hover:bg-amber-600 transition">
          Entrar
        </button>
      </form>
    </div>
  );
};
