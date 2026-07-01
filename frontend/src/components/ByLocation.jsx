import React from 'react';
import { ChevronRight } from 'lucide-react';
import { LOCS } from '../constants';

export const ByLocation = ({ eq, onSelect }) => (
  <div className="p-6 space-y-4">
    <div>
      <h2 className="text-xl font-bold text-slate-800">Por Localização</h2>
      <p className="text-sm text-slate-400 mt-0.5">Visão agrupada de todos os equipamentos</p>
    </div>
    {Object.entries(LOCS).map(([key, loc]) => {
      const items = eq.filter(e => (e.currentLocation || 'almoxarifado') === key);
      return (
        <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          style={{borderLeftWidth:"4px", borderLeftColor: loc.color}}>
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
            <div className="w-2 h-2 rounded-full" style={{background: loc.color}}/>
            <span className="text-sm font-semibold text-slate-700">{loc.label}</span>
            <span className="text-xs text-slate-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {items.length} equipamento{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          {items.length === 0
            ? <div className="px-5 py-4 text-sm text-slate-400 italic">Nenhum equipamento nesta localização.</div>
            : items.map(e => (
              <div key={e.id} onClick={() => onSelect(e)}
                className="flex items-center gap-4 px-5 py-3 hover:bg-amber-50 cursor-pointer border-t border-gray-50 transition-colors group">
                <span className="font-mono font-bold text-amber-600 text-sm w-24 shrink-0">{e.id}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{e.description}</div>
                  <div className="text-xs text-slate-400">{e.manufacturer} · {e.model}</div>
                </div>
                <span className="text-xs text-slate-400 shrink-0 hidden md:block">{e.category}</span>
                <ChevronRight size={13} className="text-gray-300 group-hover:text-amber-400 transition-colors shrink-0"/>
              </div>
            ))
          }
        </div>
      );
    })}
  </div>
);
