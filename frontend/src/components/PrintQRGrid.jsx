import React, { useState } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Settings2 } from 'lucide-react';

export const PrintQRGrid = ({ items, onClose }) => {
  const [size, setSize] = useState('medium'); // small, medium, large
  const [showDesc, setShowDesc] = useState(true);
  const [showId, setShowId] = useState(true);

  if (!items || items.length === 0) return null;

  const sizeConfigs = {
    small: { grid: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8 print:grid-cols-8', qrSize: 60, p: 'p-2', text: 'text-[8px]' },
    medium: { grid: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5 print:grid-cols-5', qrSize: 120, p: 'p-4', text: 'text-xs' },
    large: { grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-3', qrSize: 200, p: 'p-6', text: 'text-base' }
  };
  const conf = sizeConfigs[size];

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto">
      {/* Non-printable header */}
      <div className="print:hidden sticky top-0 bg-slate-900 text-white p-4 flex flex-col md:flex-row gap-4 justify-between md:items-center shadow-md z-10">
        <div>
          <h2 className="text-xl font-bold text-amber-500">Impressão de Etiquetas</h2>
          <p className="text-sm text-slate-400">({items.length} itens selecionados)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-slate-800 p-2 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">Tamanho:</span>
            <select value={size} onChange={e => setSize(e.target.value)}
              className="bg-slate-700 text-white text-xs rounded border border-slate-600 px-2 py-1 outline-none">
              <option value="small">Pequeno (3x3 cm)</option>
              <option value="medium">Médio (5x5 cm)</option>
              <option value="large">Grande (10x10 cm)</option>
            </select>
          </div>
          <div className="w-px h-6 bg-slate-700 hidden md:block"></div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-300">
            <input type="checkbox" checked={showId} onChange={e => setShowId(e.target.checked)} className="rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500" /> ID
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-300">
            <input type="checkbox" checked={showDesc} onChange={e => setShowDesc(e.target.checked)} className="rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500" /> Descrição
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors text-sm">
            Voltar
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors text-sm shadow-lg shadow-amber-500/20">
            Imprimir Agora
          </button>
        </div>
      </div>

      {/* Printable Grid - A4 Page simulation */}
      <div className={`p-8 print:p-0 grid gap-4 print:gap-2 print:text-black ${conf.grid}`}>
        {items.map(eq => (
          <div key={eq.id} className={`border-2 border-dashed border-slate-300 print:border-solid print:border-black flex flex-col items-center justify-center text-center break-inside-avoid ${conf.p}`}>
            {showId && <h3 className={`font-bold mb-1 ${conf.text}`}>{eq.id}</h3>}
            <div className="bg-white p-1 print:p-0">
              <QRCode value={eq.qrCodeData || `{"id":"${eq.id}"}`} size={conf.qrSize} level="M" />
            </div>
            {showDesc && <p className={`font-semibold mt-1 line-clamp-2 ${conf.text}`}>{eq.description}</p>}
            <p className={`text-slate-500 print:text-black mt-0.5 ${conf.text === 'text-base' ? 'text-xs' : 'text-[8px]'}`}>
              {eq.patrimony || eq.serial || "S/N"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
