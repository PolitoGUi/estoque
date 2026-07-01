import React, { useMemo, useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, Calendar, ShieldAlert } from 'lucide-react';
import { LOCS, EVT_LABELS } from '../constants';
import { fmtShort } from '../utils/helpers';
import { LocBadge } from './MicroComponents';
import api from '../api';

export const Dashboard = ({ eq, onSelect }) => {
  const [metrics, setMetrics] = useState({
    movimentacoesHoje: 0,
    movimentacoesSemana: 0,
    equipamentosOciosos: 0
  });

  useEffect(() => {
    api.get('/dashboard').then(r => setMetrics(r.data)).catch(console.error);
  }, []);

  const counts = useMemo(() => {
    const c = {};
    Object.keys(LOCS).forEach(k => c[k] = 0);
    eq.forEach(e => { const l = e.currentLocation || 'almoxarifado'; c[l] = (c[l]||0)+1; });
    return c;
  }, [eq]);

  const recent = useMemo(() => {
    const evts = eq.flatMap(e => e.events ? e.events.map(ev => ({...ev, eqId: e.id, description: e.description})) : []);
    return evts.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,12);
  }, [eq]);

  const inMaintenance = useMemo(() => {
    return eq.filter(e => e.currentLocation === 'manutencao' || e.currentLocation === 'laboratorio');
  }, [eq]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Painel Geral</h2>
          <p className="text-sm text-slate-400 mt-0.5">{eq.length} equipamentos cadastrados no sistema</p>
        </div>
      </div>

      {/* Top Cards: Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Object.entries(LOCS).map(([key, loc]) => {
          const n = counts[key] || 0;
          const pct = eq.length ? (n / eq.length) * 100 : 0;
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors shadow-sm">
              <div className="text-3xl font-bold text-slate-800">{n}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium leading-tight">{loc.label}</div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{background: loc.color, width:`${pct}%`}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Executive Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Movimentações Hoje</div>
            <div className="text-2xl font-bold text-slate-800">{metrics.movimentacoesHoje}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Movimentações na Semana</div>
            <div className="text-2xl font-bold text-slate-800">{metrics.movimentacoesSemana}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500">Equipamentos Ociosos (+30d)</div>
            <div className="text-2xl font-bold text-slate-800">{metrics.equipamentosOciosos}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[400px] shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 shrink-0">
            <Activity size={16} className="text-slate-400"/>
            <h3 className="text-sm font-bold text-slate-700">Atividade Recente</h3>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto">
            {recent.map(evt => {
              const e = eq.find(x => x.id === evt.eqId);
              return (
                <div key={evt.id}
                  onClick={() => e && onSelect(e)}
                  className={`flex items-start gap-3 px-5 py-3 transition-colors ${e ? "hover:bg-amber-50 cursor-pointer" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-600">{evt.eqId}</span>
                      <span className="text-xs text-slate-600 font-medium">{EVT_LABELS[evt.type] || evt.type}</span>
                      {evt.destination && <LocBadge loc={evt.destination}/>}
                    </div>
                    {e && <div className="text-xs text-slate-500 truncate mt-1">{evt.description}</div>}
                  </div>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">{fmtShort(evt.timestamp)}</span>
                </div>
              );
            })}
            {!recent.length && <div className="p-8 text-sm text-center text-slate-400">Nenhuma atividade recente.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[400px] shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-500" />
              <h3 className="text-sm font-bold text-slate-700">Em Manutenção / Defeitos</h3>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              {inMaintenance.length} itens
            </span>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto">
            {inMaintenance.map(e => (
              <div key={e.id}
                onClick={() => onSelect(e)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50 cursor-pointer transition-colors group">
                <span className="font-mono text-xs font-bold text-red-500 w-16 shrink-0">{e.id}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{e.description}</div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{e.manufacturer} · {e.model}</div>
                </div>
              </div>
            ))}
            {!inMaintenance.length && <div className="p-8 text-sm text-slate-400 text-center">Nenhum equipamento em manutenção no momento.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
