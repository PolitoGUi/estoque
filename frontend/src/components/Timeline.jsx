import React from 'react';
import { fmtDate } from '../utils/helpers';
import { EVT_LABELS, LOCS } from '../constants';
import { ArrowRight, PackagePlus, ArrowLeftRight, Trash2, Edit, Activity, User, MapPin } from 'lucide-react';

const getEventConfig = (type) => {
  switch (type) {
    case 'cadastro': return { icon: PackagePlus, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    case 'movimentacao': return { icon: ArrowLeftRight, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
    case 'manutencao': return { icon: Edit, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
    case 'sucata': return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
    default: return { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
  }
};

export const Timeline = ({ events }) => {
  if (!events || events.length === 0) {
    return <div className="py-8 text-center text-slate-400 text-sm">Nenhum histórico disponível.</div>;
  }

  return (
    <div className="relative border-l border-slate-200 ml-4 space-y-6 pb-4">
      {events.map((evt, idx) => {
        const conf = getEventConfig(evt.type);
        const Icon = conf.icon;
        
        return (
          <div key={evt.id || idx} className="relative pl-6">
            <span className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-white ${conf.bg} ${conf.border} border`}>
              <Icon size={12} className={conf.color} />
            </span>
            
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-slate-800">{EVT_LABELS[evt.type] || evt.type}</h4>
                <time className="text-xs font-semibold text-slate-400">{fmtDate(evt.timestamp)}</time>
              </div>
              
              {(evt.origin || evt.destination) && (
                <div className="flex items-center gap-2 mb-3 text-xs font-medium">
                  {evt.origin && (
                    <span className="flex items-center gap-1 text-slate-600 px-2 py-1 bg-slate-50 rounded">
                      <MapPin size={10}/> {LOCS[evt.origin]?.label || evt.origin}
                    </span>
                  )}
                  {evt.origin && evt.destination && <ArrowRight size={12} className="text-slate-300"/>}
                  {evt.destination && (
                    <span className="flex items-center gap-1 text-slate-600 px-2 py-1 bg-slate-50 rounded">
                      <MapPin size={10}/> {LOCS[evt.destination]?.label || evt.destination}
                    </span>
                  )}
                </div>
              )}
              
              {evt.notes && (
                <p className="text-sm text-slate-600 mb-3 bg-slate-50 p-2.5 rounded border border-slate-100 italic">
                  "{evt.notes}"
                </p>
              )}
              
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <User size={12} />
                <span>{evt.user?.name || 'Usuário desconhecido'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
