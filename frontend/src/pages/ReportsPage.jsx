import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Filter, FileText, MapPin } from 'lucide-react';
import { LOCS } from '../constants';
import api from '../api';
import { fmtDate } from '../utils/helpers';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MainLayout } from './MainLayout';

export const ReportsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('events');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [filteredData, setFilteredData] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (reportType === 'events') {
        const res = await api.get('/events'); // This endpoint needs to return all events or support filtering
        setData(res.data);
      } else {
        const res = await api.get('/equipments');
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reportType]);

  useEffect(() => {
    let result = data;
    
    // Filter by Search Text
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(s)
        );
      });
    }

    // Filter by Date Range
    if (startDate || endDate) {
      result = result.filter(row => {
        const rowDateStr = row.timestamp || row.createdAt;
        if (!rowDateStr) return true;
        const rowDate = new Date(rowDateStr);
        rowDate.setHours(0,0,0,0);
        
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0,0,0,0);
          if (rowDate < sDate) return false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(0,0,0,0);
          if (rowDate > eDate) return false;
        }
        return true;
      });
    }
    
    // Filter by Location
    if (locationFilter !== 'all') {
      result = result.filter(row => {
        if (reportType === 'events') {
          return row.origin === locationFilter || row.destination === locationFilter;
        } else {
          return row.currentLocation === locationFilter;
        }
      });
    }

    setFilteredData(result);
  }, [data, searchTerm, startDate, endDate, locationFilter, reportType]);

  const cleanData = (dataset) => {
    if (!dataset || dataset.length === 0) return [];
    return dataset.map(row => {
      const flat = {};
      Object.keys(row).forEach(k => {
        if (typeof row[k] !== 'object' && row[k] !== null) {
          flat[k] = (String(k).toLowerCase().includes('time') || String(k).toLowerCase().includes('date')) 
            ? fmtDate(row[k]) 
            : row[k];
        } else if (k === 'user' && row[k]) {
          flat['user'] = row[k].name;
        }
      });
      return flat;
    });
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(cleanData(data));
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${reportType}_${new Date().getTime()}.csv`;
    link.click();
  };

  const exportExcel = () => {
    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(cleanData(data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, `relatorio_${reportType}_${new Date().getTime()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Relatório de ${reportType === 'events' ? 'Movimentações' : 'Equipamentos'}`, 14, 15);
    
    if (filteredData.length === 0) return;

    const cleaned = cleanData(filteredData);
    const keys = Object.keys(cleaned[0]);
    const tableData = cleaned.map(row => keys.map(k => String(row[k] || '')));

    doc.autoTable({
      head: [keys],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] } // amber-500
    });

    doc.save(`relatorio_${reportType}_${new Date().getTime()}.pdf`);
  };

  return (
    <MainLayout view="reports">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Relatórios e Exportações</h2>
            <p className="text-sm text-slate-400 mt-0.5">Extraia dados de equipamentos e auditorias</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors">CSV</button>
            <button onClick={exportExcel} className="px-3 py-2 bg-emerald-500 text-white border border-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors">Excel</button>
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm">
              <Download size={15}/> PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide block mb-1.5">Tipo de Relatório</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="events">Histórico de Movimentações (Eventos)</option>
              <option value="equipments">Inventário de Equipamentos</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide block mb-1.5">Busca Textual</label>
            <input type="text" placeholder="Ex: CLP, WEG, AT-001..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide block mb-1.5">Localização</label>
            <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="all">Todas</option>
              {Object.entries(LOCS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide block mb-1.5">Data Início</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide block mb-1.5">Data Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <button onClick={() => {}} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors h-[38px]">
            <Filter size={15}/> Filtrar
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse">Carregando dados...</div>
          ) : filteredData.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={32} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-slate-400 text-sm">Nenhum dado encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 shadow-sm z-10">
                  <tr className="text-left">
                    {reportType === 'events' ? (
                      <>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">ID Equipamento</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Tipo</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Origem</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Destino</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Usuário</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Data/Hora</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Notas</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">ID</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Descrição</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Categoria</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Fabricante</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Modelo</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Série</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Patrimônio</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Criado Em</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-amber-50 transition-colors">
                      {reportType === 'events' ? (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600 font-mono text-xs">{row.equipmentId || ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.type || ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.origin || '—'}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.destination || '—'}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.user?.name || ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{fmtDate(row.timestamp)}</td>
                          <td className="px-4 py-2 text-slate-600 max-w-xs truncate" title={row.notes || ''}>{row.notes || '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600 font-mono text-xs">{row.id || ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.description || ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.category || ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.manufacturer || ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.model || ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.serial || '—'}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{row.patrimony || '—'}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{fmtDate(row.createdAt)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredData.length > 50 && (
            <div className="px-4 py-3 bg-slate-50 text-xs text-slate-500 text-center border-t border-gray-200">
              Mostrando apenas os 50 primeiros registros. Faça o download para ver todos os {filteredData.length} registros.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
