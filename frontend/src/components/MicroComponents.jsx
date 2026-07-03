import React from 'react';
import { LOCS, OBS_CATS } from '../constants';

export const LocBadge = ({ loc }) => {
  const l = LOCS[loc] || LOCS.almoxarifado;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wide ${l.badge}`}>
      {l.short}
    </span>
  );
};

export const CatBadge = ({ cat }) => {
  const c = OBS_CATS[cat] || OBS_CATS.observacao;
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${c.cls}`}>{c.label}</span>;
};

export const Av = ({ initials }) => (
  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500 text-white text-xs font-bold shrink-0 uppercase">
    {initials || "?"}
  </span>
);

export const StatusBadge = ({ status }) => {
  const s = require('../constants').EQ_STATUS[status];
  if (!s) return <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{status}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.color} border ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.color.replace('text-', 'bg-')}`}></span>
      {s.label}
    </span>
  );
};
