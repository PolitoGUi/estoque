import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, ChevronRight, Package, Filter, ChevronLeft, SlidersHorizontal, Printer, MapPin, Activity, MoveRight, Settings2, ChevronDown, Check, Download, Upload } from 'lucide-react';
import { LOCS, EQ_STATUS } from '../constants';
import { LocBadge, StatusBadge } from './MicroComponents';
import { useSearchParams } from 'react-router-dom';
import { PrintQRGrid } from './PrintQRGrid';
import { ConfirmDialog } from './Modals';
import api from '../api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export const EqList = ({ eq, onSelect, onNew, canCreate }) => {
  const [searchParams] = useSearchParams();
  const globalQ = searchParams.get('q') || '';
  const initialLoc = searchParams.get('loc') || 'all';
  
  const [q, setQ] = useState(globalQ);
  const [loc, setLoc] = useState(initialLoc);
  const [cat, setCat] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const [selectedEqs, setSelectedEqs] = useState([]);
  const [showPrint, setShowPrint] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState({ type: null, value: '' });
  const [confirmBulk, setConfirmBulk] = useState(null);
  
  const fileInputRef = useRef(null);

  const executeBulkAction = async (action, value) => {
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

  const handleBulkAction = (action, value) => {
    setConfirmBulk({ action, value });
  };

  const handleExport = () => {
    const data = filtered.map(e => ({
      ID: e.id,
      Descrição: e.description,
      Fabricante: e.manufacturer,
      Modelo: e.model,
      Categoria: e.category,
      Patrimônio: e.patrimony || "",
      Série: e.serial || "",
      Status: e.status || "Disponível",
      Localização: e.currentLocation || "almoxarifado"
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Equipamentos");
    XLSX.writeFile(wb, "Equipamentos.xlsx");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let currentMaxId = eq.length > 0 ? Math.max(0, ...eq.map(e => parseInt(String(e.id).replace("AT-",""))).filter(n => !isNaN(n))) : 0;
        
        const equipments = [];
        data.forEach(row => {
          const desc = String(row['Descrição'] || row.Descricao || row.Description || "").trim();
          if (!desc) return; // Ignora linhas sem descrição (vazias)
          
          let qty = parseInt(row.Quantidade || row.Qty || row.Qtd || 1);
          if (isNaN(qty) || qty < 1) qty = 1;

          for (let i = 0; i < qty; i++) {
            let rowId = String(row.ID || "").trim();
            if (!rowId || qty > 1) {
              currentMaxId++;
              rowId = `AT-${String(currentMaxId).padStart(6, "0")}`;
            }

            equipments.push({
              id: rowId,
              description: desc,
              manufacturer: String(row.Fabricante || row.Marca || row.Manufacturer || "").trim(),
              model: String(row.Modelo || row.Model || "").trim(),
              category: String(row.Categoria || row.Category || "").trim(),
              patrimony: String(row['Patrimônio'] || row.Patrimony || "").trim(),
              serial: String(row['Nº_de_Serie'] || row['Série'] || row.Serial || "").trim(),
              status: String(row.Status || "").trim()
            });
          }
        });

        if (equipments.length === 0) {
          toast.error("Nenhum dado válido encontrado na planilha.");
          return;
        }

        toast.loading(`Importando ${equipments.length} itens...`, { id: 'import' });
        await api.post('/equipments/bulk-import', { equipments });
        toast.success("Importação concluída com sucesso!", { id: 'import' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        if (error.response?.data?.missing) {
          const m = error.response.data.missing;
          toast.error(
            <div>
              <b>Validação Falhou! Dicionário Incompleto:</b><br/>
              {m.categories?.length > 0 && <div>Cat: {m.categories.join(', ')}</div>}
              {m.manufacturers?.length > 0 && <div>Fab: {m.manufacturers.join(', ')}</div>}
              {m.models?.length > 0 && <div>Mod: {m.models.join(', ')}</div>}
            </div>,
            { id: 'import', duration: 10000 }
          );
        } else {
          toast.error("Erro na importação: " + (error.response?.data?.error || error.message), { id: 'import' });
        }
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  useEffect(() => {
    setQ(globalQ);
    setLoc(initialLoc);
    setPage(1);
  }, [globalQ, initialLoc]);

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
            <div className="fixed md:relative bottom-[84px] md:bottom-auto left-4 right-4 md:left-auto md:right-auto z-40 flex flex-wrap md:flex-nowrap gap-2 p-3 md:p-1 bg-white md:bg-amber-50 border-2 md:border border-amber-500 md:border-amber-200 rounded-xl md:rounded-lg shadow-2xl md:shadow-none animate-in slide-in-from-bottom-4 md:zoom-in-95 justify-center">
              <div className="absolute -top-3 md:hidden bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {selectedEqs.length} selecionados
              </div>
              <button onClick={() => setShowPrint(true)} disabled={bulkLoading}
                className="flex-1 md:flex-none flex justify-center items-center gap-2 px-3 py-2 md:py-1.5 bg-slate-800 text-white rounded-lg md:rounded-md text-xs font-semibold hover:bg-slate-700 transition-colors shadow-sm">
                <Printer size={14}/> Imprimir <span className="hidden md:inline">({selectedEqs.length})</span>
              </button>
              <div className="relative flex-1 md:flex-none flex items-center">
                <MoveRight size={13} className="absolute left-2 text-slate-500 pointer-events-none" />
                <select value={bulkAction.type === 'move' ? bulkAction.value : ''} onChange={(e) => setBulkAction({ type: 'move', value: e.target.value })} disabled={bulkLoading}
                  className="w-full pl-7 pr-6 py-2 md:py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg md:rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none">
                  <option value="">Mover...</option>
                  {Object.keys(LOCS).map(k => <option key={k} value={k}>{LOCS[k].label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative flex-1 md:flex-none flex items-center">
                <Settings2 size={13} className="absolute left-2 text-slate-500 pointer-events-none" />
                <select value={bulkAction.type === 'status' ? bulkAction.value : ''} onChange={(e) => setBulkAction({ type: 'status', value: e.target.value })} disabled={bulkLoading}
                  className="w-full pl-7 pr-6 py-2 md:py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg md:rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none">
                  <option value="">Status...</option>
                  {Object.entries(EQ_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 text-slate-400 pointer-events-none" />
              </div>
              {bulkAction.value && (
                <button onClick={() => { handleBulkAction(bulkAction.type, bulkAction.value); setBulkAction({ type: null, value: '' }); }}
                  className="w-full md:w-auto px-4 py-2 md:py-1.5 bg-amber-500 text-white rounded-lg md:rounded-md text-sm md:text-xs font-bold hover:bg-amber-600 transition-colors animate-in zoom-in flex items-center justify-center gap-1 shadow-sm">
                  <Check size={16} /> Aplicar
                </button>
              )}
            </div>
          )}
          
          <div className="flex gap-1 border-r border-gray-200 pr-2 mr-1">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
              <Download size={15}/> Exportar
            </button>
            {canCreate && (
              <>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls,.csv" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                  <Upload size={15}/> Importar
                </button>
              </>
            )}
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${showFilters ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-slate-600 hover:bg-slate-50'}`}>
            <SlidersHorizontal size={15}/> Filtros
          </button>
          {canCreate && (
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

      {confirmBulk && (
        <ConfirmDialog
          title="Ação em Lote"
          message={`Confirmar alteração em lote para ${selectedEqs.length} itens selecionados?`}
          onConfirm={() => executeBulkAction(confirmBulk.action, confirmBulk.value)}
          onCancel={() => setConfirmBulk(null)}
        />
      )}
    </div>
  );
};
