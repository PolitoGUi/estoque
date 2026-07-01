import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertCircle, FileText, ArrowRight, QrCode, Download, Activity, FileJson, Hash, Settings2 } from 'lucide-react';
import api from '../api';
import { LOCS, OBS_CATS } from '../constants';
import { fmtDate } from '../utils/helpers';
import { LocBadge, CatBadge, Av } from './MicroComponents';
import { QRCodeModal } from './Modals';
import { Timeline } from './Timeline';
import { QRCodeCanvas } from 'qrcode.react';

export const EqDetail = ({ e, refreshKey, onBack, onMove, onObs }) => {
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

  const loc  = e.currentLocation || 'almoxarifado';
  const L    = LOCS[loc] || LOCS.almoxarifado;
  const isSucata = loc === "sucata";

  if (loading) {
    return <div className="p-12 text-center text-slate-400 animate-pulse">Carregando detalhes...</div>;
  }

  const qrData = e.qrCodeData || JSON.stringify({ id: e.id, v: 1 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ChevronLeft size={16}/> Voltar para lista
        </button>
        {!isSucata && (
          <div className="flex gap-2">
            <button onClick={() => onObs(e,"defeito")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm">
              <AlertCircle size={14}/> Reportar Defeito
            </button>
            <button onClick={() => onObs(e,"observacao")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
              <FileText size={14}/> Observação
            </button>
            <button onClick={() => onMove(e)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-sm ml-2">
              <ArrowRight size={14}/> Movimentar
            </button>
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
                <span className="font-mono font-bold text-2xl text-amber-600 tracking-tight">{e.id}</span>
                <LocBadge loc={loc}/>
              </div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">{e.description}</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">{e.category}</p>
              
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
                    <div className="text-base font-mono font-bold text-slate-700 mt-1">{e.patrimony || "—"}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nº de Série</label>
                    <div className="text-base font-mono font-bold text-slate-700 mt-1">{e.serial || "—"}</div>
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
                }} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700">
                  <Download size={16}/> Baixar PNG
                </button>
                <button onClick={() => {
                  const canvas = document.getElementById(`qr-detail-${e.id}`);
                  if (!canvas) return;
                  const win = window.open('', '_blank');
                  if (!win) return alert('Bloqueador de pop-ups impediu a impressão.');
                  win.document.write(`<html><body style="text-align:center;margin-top:2rem;"><img src="${canvas.toDataURL("image/png")}" onload="window.print();window.close();" /></body></html>`);
                  win.document.close();
                }} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50">
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
