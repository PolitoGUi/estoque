import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, ChevronRight, Package, Filter, ChevronLeft, SlidersHorizontal, Printer, MapPin, Activity } from 'lucide-react';
import { LOCS, EQ_STATUS } from '../constants';
import { LocBadge, StatusBadge } from './MicroComponents';
import { useSearchParams } from 'react-router-dom';
import { PrintQRGrid } from './PrintQRGrid';
import api from '../api';
import toast from 'react-hot-toast';

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

  const [selectedEqs, setSelectedEqs] = useState([]);
  const [showPrint, setShowPrint] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleBulkAction = async (action, value) => {
    if (!window.confirm(`Confirmar alteração em lote para ${selectedEqs.length} itens?`)) return;
    setBulkLoading(true);
    try {
      const ids = selectedEqs.map(e => e.id);
      await api.post('/equipments/bulk', { ids, action, value });
      toast.success(`Ação aplicada a ${ids.length} equipamentos.`);
      setSelectedEqs([]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro na ação em lote.");
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    setQ(globalQ);
    setPage(1);
  }, [globalQ]);

  const toggleSelection = (e, item) => {
    e.stopPropagation();
    setSelectedEqs(prev => prev.some(x => x.id === item.id) ? prev.filter(x => x.id !== item.id) : [...prev, item]);
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      const newSelected = [...selectedEqs];
      paginated.forEach(item => {
        if (!newSelected.some(x => x.id === item.id)) newSelected.push(item);
      });
      setSelectedEqs(newSelected);
    } else {
      const pageIds = paginated.map(p => p.id);
      setSelectedEqs(prev => prev.filter(x => !pageIds.includes(x.id)));
    }
  };

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
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {selectedEqs.length > 0 && (
            <div className="flex gap-2 p-1 bg-amber-50 border border-amber-200 rounded-lg animate-in zoom-in-95">
              <button onClick={() => setShowPrint(true)} disabled={bulkLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-md text-xs font-semibold hover:bg-slate-700 transition-colors shadow-sm">
                <Printer size={14}/> Imprimir ({selectedEqs.length})
              </button>
              
              <select onChange={(e) => { if(e.target.value) { handleBulkAction('move', e.target.value); e.target.value = ''; } }} disabled={bulkLoading}
                className="px-2 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer">
                <option value="">🚀 Mover Selecionados...</option>
                {Object.keys(LOCS).map(k => <option key={k} value={k}>{LOCS[k].label}</option>)}
              </select>

              <select onChange={(e) => { if(e.target.value) { handleBulkAction('status', e.target.value); e.target.value = ''; } }} disabled={bulkLoading}
                className="px-2 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer">
                <option value="">⚙️ Alterar Status...</option>
                {Object.entries(EQ_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${showFilters ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50'}`}>
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

      {showPrint && <PrintQRGrid items={selectedEqs} onClose={() => setShowPrint(false)} />}

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
            {Object.entries(EQ_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
        {/* Mobile View: Cards (max-md:block, md:hidden) */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginated.length > 0 && (
            <div className="p-3 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  onChange={toggleAll}
                  checked={paginated.length > 0 && paginated.every(p => selectedEqs.some(x => x.id === p.id))} />
                Selecionar Todos
              </label>
            </div>
          )}
          {paginated.map(e => {
            const l = e.currentLocation || 'almoxarifado';
            const isSelected = selectedEqs.some(x => x.id === e.id);
            return (
              <div key={e.id} onClick={() => onSelect(e)} className={`p-4 flex gap-3 transition-colors ${isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'} active:bg-slate-100`}>
                <div onClick={(ev) => ev.stopPropagation()} className="pt-1">
                  <input type="checkbox" checked={isSelected} onChange={(ev) => toggleSelection(ev, e)} className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight">{e.description}</h3>
                      <p className="font-mono text-amber-600 text-xs font-bold mt-0.5">{e.id}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1"/>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">{e.model} · {e.manufacturer}</div>
                  <div className="text-[11px] font-mono text-slate-400">Pat: {e.patrimony || "S/N"}</div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <LocBadge loc={l} />
                    <StatusBadge status={e.status || 'FUNCIONAL'} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table (hidden on mobile) */}
        <div className="overflow-x-auto min-h-[400px] hidden md:block">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left w-12">
                  <input type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    onChange={toggleAll}
                    checked={paginated.length > 0 && paginated.every(p => selectedEqs.some(x => x.id === p.id))}
                  />
                </th>
                {["ID Interno","Descrição","Patrimônio","Categoria","Localização","Status",""].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(e => {
                const l = e.currentLocation || 'almoxarifado';
                const isSelected = selectedEqs.some(x => x.id === e.id);
                return (
                  <tr key={e.id} onClick={() => onSelect(e)}
                    className={`cursor-pointer transition-colors group ${isSelected ? 'bg-amber-50/80' : 'hover:bg-amber-50'}`}>
                    <td className="px-4 py-3 text-left" onClick={(ev) => ev.stopPropagation()}>
                      <input type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        checked={isSelected}
                        onChange={(ev) => toggleSelection(ev, e)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-600 text-sm">{e.id}</td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="font-semibold text-slate-800">{e.description}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{e.model} · {e.manufacturer}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.patrimony || "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{e.category}</td>
                    <td className="px-4 py-3"><LocBadge loc={l}/></td>
                    <td className="px-4 py-3 text-xs font-semibold">
                      <StatusBadge status={e.status || 'FUNCIONAL'} />
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
