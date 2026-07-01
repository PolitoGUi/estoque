import React, { useState, useEffect } from 'react';
import { MainLayout } from './MainLayout';
import api from '../api';
import { fmtDate } from '../utils/helpers';
import { ChevronLeft, ChevronRight, FileText, Search } from 'lucide-react';

export const AuditPage = () => {
  const [data, setData] = useState({ logs: [], total: 0, page: 1, limit: 50, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/audit?page=${page}&limit=50`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <MainLayout view="audit">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Logs do Sistema</h2>
            <p className="text-sm text-slate-400 mt-0.5">Histórico completo de auditoria</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Future specific filters can go here */}
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
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{log.action}</span>
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
