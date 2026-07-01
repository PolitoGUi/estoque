import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, ChevronRight, Package, Filter, ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { LOCS } from '../constants';
import { LocBadge } from './MicroComponents';
import { useSearchParams } from 'react-router-dom';

export const EqList = ({ eq, onSelect, onNew, userRole }) => {
  const [searchParams] = useSearchParams();
  const globalQ = searchParams.get('q') || '';
  
  const [q, setQ] = useState(globalQ);
  const [loc, setLoc] = useState("all");
  const [cat, setCat] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setQ(globalQ);
    setPage(1);
  }, [globalQ]);

  const cats = useMemo(() => [...new Set(eq.map(e => e.category))].sort(), [eq]);

  const filtered = useMemo(() => eq.filter(e => {
    const l = e.currentLocation || 'almoxarifado';
    const s = q.toLowerCase();
    const st = e.status || 'Disponível';
    const matchQ = !q || [e.id, e.patrimony, e.serial, e.description, e.model, e.manufacturer]
      .some(v => v?.toLowerCase().includes(s));
    return matchQ && (loc === "all" || l === loc) && (cat === "all" || e.category === cat) && (statusF === "all" || st === statusF);
  }), [eq, q, loc, cat, statusF]);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Equipamentos</h2>
          <p className="text-sm text-slate-400 mt-0.5">{filtered.length} equipamentos encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${showFilters ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50'}`}>
            <SlidersHorizontal size={15}/> Filtros
          </button>
          {userRole !== 'viewer' && (
            <button onClick={onNew}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm">
              <Plus size={15}/> Cadastrar
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3 flex-wrap animate-in slide-in-from-top-2">
          <div className="flex-1 min-w-52 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              placeholder="Busca por ID, patrimônio, serial, descrição, modelo, fabricante..."
              value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <select value={loc} onChange={e => { setLoc(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="all">Todas as localizações</option>
            {Object.entries(LOCS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={cat} onChange={e => { setCat(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="all">Todas as categorias</option>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="all">Todos os Status</option>
            {["Disponível", "Reservado", "Em uso", "Em manutenção", "Aguardando peça", "Sucateado"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                {["ID Interno","Descrição","Patrimônio","Categoria","Localização","Status",""].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(e => {
                const l = e.currentLocation || 'almoxarifado';
                return (
                  <tr key={e.id} onClick={() => onSelect(e)}
                    className="hover:bg-amber-50 cursor-pointer transition-colors group">
                    <td className="px-4 py-3 font-mono font-bold text-amber-600 text-sm">{e.id}</td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-semibold text-slate-800">{e.description}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{e.model} · {e.manufacturer}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.patrimony || "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{e.category}</td>
                    <td className="px-4 py-3"><LocBadge loc={l}/></td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      <span className={`px-2 py-1 rounded-full ${
                        e.status === 'Disponível' ? 'bg-emerald-100 text-emerald-700' :
                        e.status === 'Em manutenção' ? 'bg-red-100 text-red-700' :
                        e.status === 'Sucateado' ? 'bg-gray-100 text-gray-700' :
                        e.status === 'Em uso' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {e.status || 'Disponível'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors ml-auto"/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!paginated.length && (
            <div className="py-16 text-center">
              <Package size={40} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-slate-500 font-medium text-sm">Nenhum equipamento encontrado.</p>
              <p className="text-slate-400 text-xs mt-1">Tente ajustar seus filtros de busca.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-slate-50">
            <div className="text-sm text-slate-500">
              Mostrando <span className="font-semibold text-slate-700">{(page - 1) * itemsPerPage + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(page * itemsPerPage, filtered.length)}</span> de <span className="font-semibold text-slate-700">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="p-1.5 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="text-sm font-semibold text-slate-600 px-2">{page} / {totalPages}</div>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
                className="p-1.5 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
