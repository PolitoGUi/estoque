import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Camera, AlertCircle, X, ScanLine } from 'lucide-react';

export const ScannerPage = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Assuming permission is always true or handled by the scanner component's internal logic,
  // we'll keep a basic state for it if needed, but @yudiel/react-qr-scanner handles it.
  const hasPermission = true;

  const handleScan = (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const result = detectedCodes[0].rawValue;
    
    if (navigator.vibrate) navigator.vibrate(100);

    try {
      let parsed;
      try {
        parsed = JSON.parse(result);
      } catch (e) {
        parsed = { id: result };
      }
      if (!parsed.id) throw new Error("QR Code inválido.");
      
      // Navigate directly to the detail view, which was the user's explicit request
      navigate(`/?view=detail&eq=${parsed.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-900 pb-[68px]">
      {/* Header Mobile */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-white font-semibold text-lg flex items-center gap-2">
          <QrCode size={20} className="text-amber-500" /> Scanner
        </h1>
        <div className="w-10"></div> {/* Spacer to center title */}
      </header>

      {/* Câmera */}
      <div className="flex-1 flex flex-col relative bg-black overflow-hidden">
        {!hasPermission ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-4">
              <Camera size={32} />
            </div>
            <h3 className="text-white font-bold mb-2">Acesso à Câmera Necessário</h3>
            <p className="text-slate-400 text-sm">Por favor, permita o acesso à câmera para usar o scanner de QR Code.</p>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 w-full h-full">
              <Scanner
                onScan={handleScan}
                formats={['qr_code']}
                components={{
                  audio: false,
                  torch: true,
                  zoom: true,
                  finder: false
                }}
                styles={{ container: { width: '100%', height: '100%' } }}
                constraints={{ facingMode: 'environment' }}
              />
            </div>
            
            {/* Overlay Câmera Focus */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="w-64 h-64 border-2 border-amber-500/50 rounded-xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-500 rounded-tl-xl"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-500 rounded-tr-xl"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-500 rounded-bl-xl"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-500 rounded-br-xl"></div>
                
                {/* Scan Line Animation */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>

            {/* Error Overlay */}
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-xl flex items-start gap-3 shadow-2xl z-20 animate-in slide-in-from-bottom-4">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{error}</p>
                  <p className="text-xs text-red-100 mt-1">Tente novamente com um código válido.</p>
                </div>
                <button onClick={() => setError('')} className="p-1 hover:bg-red-600 rounded">
                  <X size={16} />
                </button>
              </div>
            )}
            
            {/* Instruction Tip */}
            <div className="absolute top-4 left-4 right-4 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 text-white p-3 rounded-xl flex items-center gap-3 shadow-xl z-20 text-sm">
              <ScanLine size={18} className="text-amber-500" />
              <span>Aponte para o QR Code do equipamento</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
