import React from 'react';
import QRCode from 'react-qr-code';

export const PrintQRGrid = ({ items, onClose }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto">
      {/* Non-printable header */}
      <div className="print:hidden sticky top-0 bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h2 className="text-xl font-bold text-amber-500">Impressão de Etiquetas</h2>
          <p className="text-sm text-slate-400">Pressione Ctrl+P ou Cmd+P para imprimir</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors">
            Voltar
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors">
            Imprimir Agora
          </button>
        </div>
      </div>

      {/* Printable Grid - A4 Page simulation */}
      <div className="p-8 print:p-0 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 print:gap-2 print:grid-cols-4 print:text-black">
        {items.map(eq => (
          <div key={eq.id} className="border-2 border-dashed border-slate-300 print:border-solid print:border-black p-4 flex flex-col items-center justify-center text-center break-inside-avoid">
            <h3 className="font-bold text-sm mb-1">{eq.id}</h3>
            <div className="bg-white p-2">
              <QRCode value={eq.qrCodeData || `{"id":"${eq.id}"}`} size={120} level="M" />
            </div>
            <p className="text-xs font-semibold mt-2 line-clamp-1">{eq.description}</p>
            <p className="text-[10px] text-slate-500 print:text-black mt-0.5">{eq.patrimony || eq.serial || "S/N"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
