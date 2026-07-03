import React, { useState, useEffect } from 'react';
import { MainLayout } from './MainLayout';
import api from '../api';
import { fmtDate } from '../utils/helpers';
import { ChevronLeft, ChevronRight, FileText, Search, Filter } from 'lucide-react';

const ACTION_TRANSLATIONS = {
  'LOGIN_SUCCESS': { label: 'Login Efetuado', style: 'bg-emerald-100 text-emerald-700' },
  'LOGIN_FAILED': { label: 'Falha no Login', style: 'bg-red-100 text-red-700' },
  'EQUIPMENT_CREATE': { label: 'Ativo Cadastrado', style: 'bg-blue-100 text-blue-700' },
  'EQUIPMENT_STATUS_UPDATE': { label: 'Status Alterado', style: 'bg-amber-100 text-amber-700' },
  'EQUIPMENT_BULK_MOVE': { label: 'Movimento Lote', style: 'bg-indigo-100 text-indigo-700' },
  'EQUIPMENT_BULK_STATUS': { label: 'Status Lote', style: 'bg-indigo-100 text-indigo-700' },
  'USER_CREATE': { label: 'Usuário Criado', style: 'bg-teal-100 text-teal-700' },
  'USER_UPDATE': { label: 'Usuário Editado', style: 'bg-teal-100 text-teal-700' },
  'USER_PASSWORD_RESET': { label: 'Senha Redefinida', style: 'bg-rose-100 text-rose-700' }
};

export const AuditPage = () => {
  const [data, setData] = useState({ logs: [], total: 0, page: 1, limit: 50, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = `page=${page}&limit=50${actionFilter ? `&action=${actionFilter}` : ''}`;
      const res = await api.get(`/audit?${query}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  return (
    <MainLayout view="audit">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Logs do Sistema</h2>
            <p className="text-sm text-slate-400 mt-0.5">Histórico completo de auditoria</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none shadow-sm cursor-pointer">
                <option value="">Todas as Ações</option>
                {Object.keys(ACTION_TRANSLATIONS).map(k => <option key={k} value={k}>{ACTION_TRANSLATIONS[k].label}</option>)}
              </select>
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs">Data/Hora</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs">Ação</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs">Recurso</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs">Usuário</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400 animate-pulse">Carregando auditoria...</td></tr>
                ) : data.logs.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400">Nenhum log encontrado.</td></tr>
                ) : data.logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(log.timestamp)}</td>
                    <td className="px-4 py-3">
                      {ACTION_TRANSLATIONS[log.action] ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${ACTION_TRANSLATIONS[log.action].style}`}>
                          {ACTION_TRANSLATIONS[log.action].label}
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase">{log.action}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{log.resource}</td>
                    <td className="px-4 py-3 text-slate-500">{log.user?.name || log.user?.email || 'Sistema / Anonimo'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{log.ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-slate-50">
              <div className="text-sm text-slate-500">
                Mostrando <span className="font-semibold text-slate-700">{(data.page - 1) * data.limit + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(data.page * data.limit, data.total)}</span> de <span className="font-semibold text-slate-700">{data.total}</span> registros
              </div>
              <div className="flex items-center gap-1">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <div className="text-sm font-semibold text-slate-600 px-2">{page} / {data.pages}</div>
                <button 
                  disabled={page === data.pages} 
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
