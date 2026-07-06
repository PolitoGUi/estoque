import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronLeft, AlertCircle, FileText, ArrowRight, QrCode, Download, Activity, FileJson, Hash, Settings2, Edit2, Check, X, Star, Wrench, Copy } from 'lucide-react';
import api from '../api';
import { LOCS, OBS_CATS, EQ_HEALTH } from '../constants';
import { fmtDate } from '../utils/helpers';
import { LocBadge, CatBadge, Av, StatusBadge } from './MicroComponents';
import { QRCodeModal } from './Modals';
import { Timeline } from './Timeline';
import { QRCodeCanvas } from 'qrcode.react';

export const EqDetail = ({ e, refreshKey, onBack, onMove, onObs, onDuplicate }) => {
  const [tab, setTab] = useState("info");
  const [eEvts, setEEvts] = useState([]);
  const [eObs, setEObs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [evtsRes, obsRes] = await Promise.all([
          api.get(`/events/${e.id}`),
          api.get(`/observations/${e.id}`)
        ]);
        setEEvts(evtsRes.data);
        setEObs(obsRes.data);
      } catch (err) {
        console.error("Erro ao carregar detalhes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [e.id, refreshKey]);

  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal] = useState("");

  const saveInline = async (field) => {
    try {
      await api.put(`/equipments/${e.id}`, { [field]: editVal });
      toast.success("Atualizado com sucesso.");
      e[field] = editVal; // Optimistic
      setEditField(null);
    } catch (err) {
      toast.error("Erro ao salvar.");
    }
  };



  const renderInlineEdit = (field, label, val) => {
    if (editField === field) {
      return (
        <div className="flex items-center gap-2 mt-1">
          <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} 
            className="w-full px-2 py-1 text-sm font-mono border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50" />
          <button onClick={() => saveInline(field)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={16}/></button>
          <button onClick={() => setEditField(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded"><X size={16}/></button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 mt-1 group">
        <div className="text-base font-mono font-bold text-slate-700">{val || "—"}</div>
        <button onClick={() => { setEditField(field); setEditVal(val || ""); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-500 transition-opacity">
          <Edit2 size={14}/>
        </button>
      </div>
    );
  };

  const loc  = e.currentLocation || 'almoxarifado';
  const L    = LOCS[loc] || LOCS.almoxarifado;
  const isSucata = loc === "sucata";

  if (loading) {
    return <div className="p-12 text-center text-slate-400 animate-pulse">Carregando detalhes...</div>;
  }

  const qrData = e.qrCodeData || JSON.stringify({ id: e.id, v: 1 });
  
  const defectCount = eObs.filter(o => o.category === 'defeito').length;
  let healthKey = 'SAUDAVEL';
  if (defectCount >= 2 && defectCount <= 3) healthKey = 'ATENCAO';
  else if (defectCount >= 4 && defectCount <= 5) healthKey = 'ALTO_DESGASTE';
  else if (defectCount >= 6) healthKey = 'CRITICO';
  const H = EQ_HEALTH[healthKey];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft size={16}/> Voltar para lista
        </button>
        {!isSucata && (
          <div className="fixed md:relative bottom-[84px] md:bottom-auto left-4 right-4 md:left-auto md:right-auto z-40 flex flex-wrap md:flex-nowrap items-center gap-2 bg-white md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-none animate-in slide-in-from-bottom-4 md:animate-none">
            <button onClick={() => onMove(e)}
              className="w-full md:w-auto flex justify-center items-center gap-1.5 px-4 py-2.5 md:py-1.5 text-sm md:text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-sm md:order-last">
              <ArrowRight size={16} /> <span className="md:hidden">Movimentar Equipamento</span><span className="hidden md:inline">Movimentar</span>
            </button>
            <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden">
              <button onClick={() => onObs(e,"defeito")}
                className="whitespace-nowrap flex-1 flex justify-center items-center gap-1.5 px-3 py-2 md:py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                <AlertCircle size={14}/> <span className="hidden md:inline">Reportar Defeito</span><span className="md:hidden">Defeito</span>
              </button>
              <button onClick={() => onObs(e,"reparo")}
                className="whitespace-nowrap flex-1 flex justify-center items-center gap-1.5 px-3 py-2 md:py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                <Wrench size={14}/> <span className="hidden md:inline">Reportar Reparo</span><span className="md:hidden">Reparo</span>
              </button>
              <button onClick={() => onObs(e,"observacao")}
                className="whitespace-nowrap flex-1 flex justify-center items-center gap-1.5 px-3 py-2 md:py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <FileText size={14}/> Obs
              </button>
              <button onClick={() => onDuplicate && onDuplicate({ description: e.description, model: e.model, manufacturer: e.manufacturer, category: e.category, notes: e.notes })}
                className="whitespace-nowrap flex-1 flex justify-center items-center gap-1.5 px-3 py-2 md:py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <Copy size={14}/> Duplicar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Header Summary */}
        <div className="w-full md:w-1/3 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="h-2 w-full" style={{background: L.color}}/>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-2xl text-amber-600 tracking-tight">{e.id}</span>
                </div>
                <LocBadge loc={loc}/>
              </div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">{e.description}</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">{e.category}</p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <StatusBadge status={e.status || 'Disponível'} />
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${H.color}`}>
                  {H.label}
                </span>
              </div>
              
              {isSucata && (
                <div className="mt-3 text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100 text-center uppercase tracking-wider">
                  Equipamento Encerrado (Sucata)
                </div>
              )}
            </div>
          </div>
          
          {/* Menu de Abas Lateral */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm flex flex-col gap-1">
            {[
              { k: "info", l: "Informações Básicas", icon: FileJson },
              { k: "hist", l: `Linha do Tempo (${eEvts.length})`, icon: Activity },
              { k: "obs",  l: `Defeitos & Obs (${eObs.length})`, icon: AlertCircle },
              { k: "qr",   l: "QR Code e Etiquetas", icon: QrCode },
            ].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t.k ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:bg-slate-50"
                }`}>
                <t.icon size={16} className={tab === t.k ? "text-amber-500" : "text-slate-400"} />
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[500px]">
          {tab === "info" && (
            <div className="animate-in fade-in space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Hash size={18} className="text-amber-500"/> Identificação</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patrimônio</label>
                    {renderInlineEdit('patrimony', 'Patrimônio', e.patrimony)}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nº de Série</label>
                    {renderInlineEdit('serial', 'Nº de Série', e.serial)}
                  </div>
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings2 size={18} className="text-amber-500"/> Especificações</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fabricante</label>
                    <div className="text-base font-medium text-slate-700 mt-1">{e.manufacturer}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modelo</label>
                    <div className="text-base font-medium text-slate-700 mt-1">{e.model}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "hist" && (
            <div className="animate-in fade-in">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Histórico de Movimentações</h3>
              <Timeline events={eEvts} />
            </div>
          )}

          {tab === "obs" && (
            <div className="animate-in fade-in space-y-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Registros, Defeitos e Observações</h3>
              {!eObs.length && (
                <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                  <FileText size={32} className="text-gray-300 mx-auto mb-3"/>
                  <p className="text-slate-500 font-medium">Nenhum registro encontrado.</p>
                  <p className="text-sm text-slate-400 mt-1">Use os botões acima para reportar defeitos ou observações.</p>
                </div>
              )}
              {eObs.map(o => (
                <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <CatBadge cat={o.category}/>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{fmtDate(o.timestamp)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">{o.text}</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Av initials={o.user?.initials}/>
                    <span className="text-xs font-semibold text-slate-500">{o.user?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "qr" && (
            <div className="animate-in fade-in flex flex-col items-center justify-center py-8">
              <h3 className="text-lg font-bold text-slate-800 mb-8">Etiqueta Inteligente AssetTrack</h3>
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 inline-block mb-8">
                <QRCodeCanvas id={`qr-detail-${e.id}`} value={qrData} size={220} level="M" includeMargin />
              </div>
              <div className="flex gap-4">
                <button onClick={() => {
                  const canvas = document.getElementById(`qr-detail-${e.id}`);
                  if (!canvas) return;
                  const pngUrl = canvas.toDataURL("image/png");
                  let downloadLink = document.createElement("a");
                  downloadLink.href = pngUrl;
                  downloadLink.download = `QR_${e.id}.png`;
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  toast.success("Download iniciado.");
                }} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700">
                  <Download size={16}/> Baixar PNG
                </button>
                <button onClick={() => {
                  const canvas = document.getElementById(`qr-detail-${e.id}`);
                  if (!canvas) return;
                  const win = window.open('', '_blank');
                  if (!win) return toast.error('Bloqueador de pop-ups impediu a impressão.');
                  
                  const html = `
                    <html>
                      <head>
                        <title>Etiqueta ${e.id}</title>
                        <style>
                          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background: #f8fafc; }
                          .label-container { width: 100%; max-width: 90mm; background: #fff; border: 2px solid #000; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 16px; box-sizing: border-box; page-break-inside: avoid; }
                          .qr-col { flex-shrink: 0; }
                          .qr-col img { width: 90px; height: 90px; display: block; }
                          .info-col { flex: 1; min-width: 0; }
                          .info-id { font-size: 22px; font-weight: 900; margin: 0 0 4px 0; letter-spacing: -0.5px; color: #000; }
                          .info-desc { font-size: 13px; font-weight: 700; margin: 0 0 6px 0; color: #000; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-transform: uppercase; }
                          .info-meta { font-size: 11px; margin: 0 0 2px 0; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                          @media print {
                            @page { margin: 0; }
                            body { margin: 0; padding: 0; align-items: flex-start; justify-content: flex-start; background: #fff; }
                            .label-container { border: none; padding: 0; max-width: 100mm; height: 50mm; display: flex; align-items: center; border-radius: 0; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="label-container">
                          <div class="qr-col">
                            <img src="${canvas.toDataURL("image/png")}" onload="window.print();window.close();" />
                          </div>
                          <div class="info-col">
                            <h1 class="info-id">${e.id}</h1>
                            <p class="info-desc">${e.description}</p>
                            <p class="info-meta"><strong>PAT:</strong> ${e.patrimony || 'N/A'}</p>
                            <p class="info-meta"><strong>MOD:</strong> ${e.model || 'N/A'}</p>
                          </div>
                        </div>
                      </body>
                    </html>
                  `;
                  win.document.write(html);
                  win.document.close();
                }} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 shadow-sm transition-colors">
                  <Download size={16}/> Imprimir Etiqueta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
