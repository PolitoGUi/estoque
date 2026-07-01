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
