import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Shield, Plus, Edit, Trash, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { Modal } from '../components/Modal';
import { MainLayout } from './MainLayout';

const UserModal = ({ isOpen, onClose, user, roles, onSaved }) => {
  const isEdit = !!user;
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', initials: '', roleId: '', isActive: true, forcePasswordChange: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '', email: user.email || '', password: '', 
        initials: user.initials || '', roleId: user.role?.id || '',
        isActive: user.isActive, forcePasswordChange: false
      });
    } else {
      setFormData({ name: '', email: '', password: '', initials: '', roleId: roles[0]?.id || '', isActive: true, forcePasswordChange: true });
    }
  }, [user, isOpen, roles]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/users/${user.id}`, {
          name: formData.name, initials: formData.initials, roleId: formData.roleId, isActive: formData.isActive
        });
        toast.success("Usuário atualizado!");
      } else {
        await api.post('/users', formData);
        toast.success("Usuário criado!");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao salvar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newPass = window.prompt("Digite a nova senha temporária para este usuário:");
    if (!newPass) return;
    try {
      await api.post(`/users/${user.id}/reset-password`, { password: newPass, forcePasswordChange: true });
      toast.success("Senha redefinida com sucesso! O usuário deverá trocá-la no próximo login.");
    } catch (err) {
      toast.error("Erro ao redefinir senha.");
    }
  };

  return (
    <Modal title={isEdit ? "Editar Usuário" : "Novo Usuário"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail (Login)</label>
            <input required type="email" disabled={isEdit} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50 disabled:text-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Iniciais (Avatar)</label>
            <input required maxLength={2} value={formData.initials} onChange={e => setFormData({...formData, initials: e.target.value.toUpperCase()})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 uppercase" />
          </div>
        </div>
        
        {!isEdit && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Senha Inicial</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500" />
            <p className="text-xs text-slate-400 mt-1">O usuário será forçado a alterar esta senha no primeiro acesso.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Perfil de Acesso</label>
            <select required value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">Selecione...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer h-10">
              <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
              <span className="text-sm font-semibold text-slate-700">Usuário Ativo</span>
            </label>
          </div>
        </div>

        {isEdit && (
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-sm text-slate-500">Ações de Segurança:</div>
            <button type="button" onClick={handleResetPassword}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
              <KeyRound size={14}/> Redefinir Senha
            </button>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50">Salvar Usuário</button>
        </div>
      </form>
    </Modal>
  );
};

export const AdminPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "users") {
        const [uRes, rRes] = await Promise.all([api.get('/users'), api.get('/roles')]);
        setUsers(uRes.data);
        setRoles(rRes.data);
      } else {
        const res = await api.get('/roles');
        setRoles(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (u) => {
    setEditingUser(u);
    setIsUserModalOpen(true);
  };

  return (
    <MainLayout view="admin">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Painel de Administração</h2>
            <p className="text-sm text-slate-400 mt-0.5">Gestão de usuários, perfis e permissões</p>
          </div>
          {tab === "users" && (
            <button onClick={handleNewUser} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm">
              <Plus size={15}/> Novo Usuário
            </button>
          )}
        </div>

        <div className="flex border-b border-gray-200">
          {[
            {k:"users", l:"Usuários", Icon: Users},
            {k:"roles", l:"Perfis e Permissões", Icon: Shield},
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.k ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              <t.Icon size={16}/> {t.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse">Carregando dados...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {tab === "users" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Nome</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">E-mail</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Perfil</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                          {u.initials || "U"}
                        </div>
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3 text-slate-500"><span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md text-xs font-bold">{u.role?.name || "Sem Perfil"}</span></td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {u.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEditUser(u)} className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors bg-white hover:bg-amber-50 rounded border border-transparent hover:border-amber-200">
                          <Edit size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "roles" && (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl m-4 bg-slate-50">
                <Shield size={32} className="text-slate-300 mx-auto mb-3"/>
                <p className="text-slate-500 font-semibold">Gestão de Perfis será habilitada em breve.</p>
                <p className="text-sm text-slate-400 mt-1">Atualmente os perfis e permissões são pré-carregados no banco de dados.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        user={editingUser} 
        roles={roles} 
        onSaved={fetchData} 
      />
    </MainLayout>
  );
};
