import React, { useMemo, useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, Calendar, ShieldAlert, Star } from 'lucide-react';
import { LOCS, EVT_LABELS } from '../constants';
import { fmtShort } from '../utils/helpers';
import { LocBadge } from './MicroComponents';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export const Dashboard = ({ eq, onSelect }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    movimentacoesHoje: 0,
    movimentacoesSemana: 0,
    equipamentosOciosos: 0
  });
  const [favorites, setFavorites] = useState([]);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(LOCS).map(([key, loc]) => {
          const n = counts[key] || 0;
          const pct = eq.length ? (n / eq.length) * 100 : 0;
          
          // Hide "cliente" location on mobile to keep it to 4 main cards
          const mobileHidden = key === 'cliente' ? 'hidden md:block' : '';

          return (
            <div key={key} onClick={() => navigate(`/?view=list&loc=${key}`)} className={`glass-panel rounded-xl md:rounded-2xl p-3 md:p-4 transition-all duration-300 cursor-pointer ${n === 0 ? 'opacity-40 grayscale' : 'hover:shadow-lg hover:-translate-y-1'} ${mobileHidden}`}>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{n}</div>
              <div className="text-[10px] md:text-xs text-slate-500 mt-1 font-bold uppercase tracking-wider truncate">{key === 'manutencao' ? 'Com Defeito' : loc.label}</div>
              <div className="mt-3 md:mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{background: `linear-gradient(90deg, ${loc.color}88 0%, ${loc.color} 100%)`, width:`${pct}%`}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Executive Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-5 hover:shadow-lg transition-all duration-300">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Clock size={28} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Movimentações Hoje</div>
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{metrics.movimentacoesHoje}</div>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 md:flex items-center gap-5 hover:shadow-lg transition-all duration-300 hidden">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Calendar size={28} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Movimentações na Semana</div>
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{metrics.movimentacoesSemana}</div>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 md:flex items-center gap-5 hover:shadow-lg transition-all duration-300 hidden">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <AlertTriangle size={28} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ociosos (+30d)</div>
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{metrics.equipamentosOciosos}</div>
          </div>
        </div>
      </div>

      {/* Botão Gigante Scanner Mobile */}
      <div className="md:hidden">
        <button onClick={() => navigate('/scanner')}
          className="w-full flex flex-col items-center justify-center gap-3 bg-slate-900 text-white p-6 rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all">
          <div className="p-4 bg-amber-500 rounded-full text-white shadow-lg shadow-amber-500/40 animate-pulse">
            <QrCode size={32} />
          </div>
          <span className="text-lg font-bold">Ler Etiqueta QR</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 hidden md:grid">
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
