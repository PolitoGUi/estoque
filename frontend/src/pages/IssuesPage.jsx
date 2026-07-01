import React, { useState, useEffect } from 'react';
import { MainLayout } from './MainLayout';
import { CheckCircle, Clock, AlertTriangle, Play, Wrench } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { fmtDate } from '../utils/helpers';

export const IssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/issues');
      setIssues(res.data);
    } catch (err) {
      toast.error('Erro ao carregar pendências.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/issues/${id}/status`, { status });
      toast.success('Status da pendência atualizado!');
      loadIssues();
    } catch (err) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const getStatusConfig = (st) => {
    switch (st) {
      case 'OPEN': return { label: 'Aberta', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle };
      case 'IN_PROGRESS': return { label: 'Em Andamento', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Play };
      case 'RESOLVED': return { label: 'Resolvida', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle };
      default: return { label: st, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Clock };
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <Wrench size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pendências / Manutenção</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">Gestão de reparos e chamados de manutenção</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {issues.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Nenhuma pendência</h3>
                <p className="text-slate-500">O parque de equipamentos está em perfeitas condições.</p>
              </div>
            )}
            
            {issues.map(issue => {
              const conf = getStatusConfig(issue.status);
              const Icon = conf.icon;
              return (
                <div key={issue.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        #{issue.id.slice(0,8).toUpperCase()}
                      </span>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${conf.color}`}>
                        <Icon size={12} /> {conf.label}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {fmtDate(issue.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">{issue.title}</h3>
                    {issue.description && <p className="text-sm text-slate-600 mb-3">{issue.description}</p>}
                    
                    {issue.equipment && (
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                        <span className="text-amber-600">{issue.equipment.id}</span>
                        <span className="text-slate-400">|</span>
                        <span>{issue.equipment.description}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex md:flex-col gap-2 shrink-0 md:w-40 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 justify-center">
                    {issue.status !== 'IN_PROGRESS' && issue.status !== 'RESOLVED' && (
                      <button onClick={() => handleUpdateStatus(issue.id, 'IN_PROGRESS')}
                        className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-colors border border-amber-200">
                        Iniciar Reparo
                      </button>
                    )}
                    {issue.status !== 'RESOLVED' && (
                      <button onClick={() => handleUpdateStatus(issue.id, 'RESOLVED')}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors border border-emerald-200">
                        Marcar Resolvido
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
