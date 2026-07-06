import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Shield, Plus, Edit, Trash, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { Modal } from '../components/Modal';
import { MainLayout } from './MainLayout';

const PERM_LABELS = {
  'equipment.create': 'Cadastro',
  'equipment.edit': 'Edição',
  'equipment.move': 'Movimentação',
  'equipment.scrap': 'Sucateamento',
  'equipment.view': 'Leitura',
  'observation.create': 'Registros (Defeitos/Testes)',
  'reports.export': 'Relatórios',
  'audit.view': 'Auditoria',
  'users.manage': 'Gerir Usuários',
  'settings.manage': 'Configurações'
};

const RoleModal = ({ isOpen, onClose, role, onSaved }) => {
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        permissions: role.permissions?.map(p => p.permission.name) || []
      });
    }
  }, [role, isOpen]);

  if (!isOpen) return null;

  const togglePerm = (k) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(k) ? prev.permissions.filter(p => p !== k) : [...prev.permissions, k]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/roles/${role.id}`, formData);
      toast.success("Cargo atualizado com sucesso!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Erro ao atualizar cargo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Editar Cargo: ${role?.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Cargo</label>
          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
          <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Permissões do Cargo</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PERM_LABELS).map(([k, v]) => (
              <button type="button" key={k} onClick={() => togglePerm(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  formData.permissions.includes(k) 
                    ? "bg-amber-100 border-amber-300 text-amber-800" 
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}>
                {formData.permissions.includes(k) && "✓ "}
                {v}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            * Alterar as permissões de um cargo afetará automaticamente todos os usuários vinculados a ele.
          </p>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2 font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50">Salvar Cargo</button>
        </div>
      </form>
    </Modal>
  );
};

const UserModal = ({ isOpen, onClose, user, roles, onSaved }) => {
  const isEdit = !!user;
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', initials: '', roleId: '', isActive: true, forcePasswordChange: true, permissions: []
  });
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '', email: user.email || '', password: '', 
        initials: user.initials || '', roleId: user.role?.id || '',
        isActive: user.isActive, forcePasswordChange: false,
        permissions: user.permissions || []
      });
      setResettingPassword(false);
      setNewPassword('');
    } else {
      setFormData({ name: '', email: '', password: '', initials: '', roleId: roles[0]?.id || '', isActive: true, forcePasswordChange: true, permissions: [] });
    }
  }, [user, isOpen, roles]);

  if (!isOpen) return null;

  const togglePerm = (p) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(p) ? prev.permissions.filter(x => x !== p) : [...prev.permissions, p]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/users/${user.id}`, {
          name: formData.name, initials: formData.initials, roleId: formData.roleId, isActive: formData.isActive, permissions: formData.permissions
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

  const executePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres");
    try {
      await api.post(`/users/${user.id}/reset-password`, { password: newPassword, forcePasswordChange: true });
      toast.success("Senha redefinida com sucesso! O usuário deverá trocá-la no próximo login.");
      setResettingPassword(false);
      setNewPassword('');
    } catch (err) {
      toast.error("Erro ao redefinir senha.");
    }
  };

  const selectedRole = roles.find(r => r.id === Number(formData.roleId));
  const rolePerms = selectedRole?.permissions?.map(p => p.permission.name) || [];

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
            <label className="block text-sm font-semibold text-slate-700 mb-1">Perfil Base</label>
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

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Privilégios e Tags</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PERM_LABELS).map(([k, v]) => {
              const isBasePerm = rolePerms.includes(k);
              const isExtraPerm = formData.permissions.includes(k);
              const isActive = isBasePerm || isExtraPerm;
              
              return (
                <button type="button" key={k} onClick={() => {
                  if (isBasePerm) {
                    toast('Esta tag já é nativa do Perfil Base.', { icon: 'ℹ️' });
                    return;
                  }
                  togglePerm(k);
                }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isBasePerm ? "bg-amber-100/50 border-amber-200 text-amber-700/80 cursor-not-allowed" 
                    : isExtraPerm ? "bg-amber-100 border-amber-400 text-amber-800" 
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}>
                  {isActive && "✓ "}
                  {v}
                  {isBasePerm && <span className="ml-1 text-[9px] font-normal italic">(Padrão do Cargo)</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            * As tags marcadas como "Padrão do Cargo" são herdadas do Perfil Base selecionado. Adicione tags apenas se precisar conceder acessos extra a este usuário (Ex: Operador com acesso a Relatórios).
          </p>
        </div>

        {isEdit && (
          <div className="pt-4 mt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-500 font-semibold">Ações de Segurança:</div>
              <button type="button" onClick={() => setResettingPassword(!resettingPassword)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                <KeyRound size={14}/> {resettingPassword ? 'Cancelar Redefinição' : 'Redefinir Senha'}
              </button>
            </div>
            {resettingPassword && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex gap-2">
                <input type="password" placeholder="Nova senha temporária" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <button type="button" onClick={executePasswordReset}
                  className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors">
                  Confirmar
                </button>
              </div>
            )}
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

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

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

  const handleEditRole = (r) => {
    setEditingRole(r);
    setIsRoleModalOpen(true);
  };

  return (
    <MainLayout view="admin">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Painel de Administração</h2>
            <div className="flex gap-4 mt-2">
              <button onClick={() => setTab("users")} className={`text-sm font-semibold border-b-2 pb-1 transition-colors ${tab === "users" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Usuários</button>
              <button onClick={() => setTab("roles")} className={`text-sm font-semibold border-b-2 pb-1 transition-colors ${tab === "roles" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Cargos e Permissões</button>
            </div>
          </div>
          {tab === "users" && (
            <button onClick={handleNewUser} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm">
              <Plus size={15}/> Novo Usuário
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse">Carregando dados...</div>
        ) : tab === "users" ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Usuário</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Perfil Base</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tags Adicionais</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status & Acesso</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase shrink-0">
                          {u.initials || "U"}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">Criado em: {new Date(u.createdAt).toLocaleDateString('pt-BR')}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                          {u.role?.name || "Sem Perfil"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {u.permissions?.length > 0 ? (
                            u.permissions.map(p => (
                              <span key={p} className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                {PERM_LABELS[p] || p}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">Nenhuma tag adicional</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wide font-bold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {u.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                          {u.lastLogin && (
                            <span className="text-[10px] text-slate-500 font-medium">Últ. Login: {new Date(u.lastLogin).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEditUser(u)} className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors bg-white hover:bg-amber-50 rounded border border-transparent hover:border-amber-200 shadow-sm">
                          <Edit size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(r => (
              <div key={r.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:border-amber-200 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <Shield size={16} className="text-amber-500"/> {r.name}
                    </h3>
                  </div>
                  <button onClick={() => handleEditRole(r)} className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors bg-slate-50 hover:bg-amber-50 rounded-lg group-hover:border-amber-200 border border-transparent shadow-sm">
                    <Edit size={14}/>
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-6 flex-1">{r.description || "Nenhuma descrição"}</p>
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Tags do Cargo</div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions?.length > 0 ? (
                      r.permissions.map(p => (
                        <span key={p.permission.name} className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                          {PERM_LABELS[p.permission.name] || p.permission.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Nenhuma permissão associada</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={editingRole}
        onSaved={fetchData}
      />
    </MainLayout>
  );
};
