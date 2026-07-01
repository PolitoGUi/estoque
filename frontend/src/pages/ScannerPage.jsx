import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Activity, MapPin, Search, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { LOCS } from '../constants';

export const ScannerPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [eq, setEq] = useState(null);
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const navigate = useNavigate();

  const handleScan = (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const result = detectedCodes[0].rawValue;
    
    try {
      let parsed;
      try {
        parsed = JSON.parse(result);
      } catch (e) {
        parsed = { id: result };
      }
      if (!parsed.id) throw new Error("QR Code inválido.");
      
      setScanResult(parsed);
      fetchEq(parsed.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchEq = async (id) => {
    try {
      // Procurar nos equipamentos (vamos listar todos e achar, ou precisaríamos de rota específica)
      // Como o /api/equipments lista tudo, podemos filtrar.
      const res = await api.get('/equipments');
      const found = res.data.find(x => x.id === id);
      if (found) {
        setEq(found);
      } else {
        toast.error("Equipamento não encontrado.");
      }
    } catch (e) {
      toast.error("Erro ao carregar equipamento");
    }
  };

  const handleQuickMove = async (dest) => {
    if (!eq) return;
    setLoadingAction(true);
    try {
      await api.post('/events', {
        equipmentId: eq.id,
        type: dest === 'sucata' ? 'sucata' : 'movimentacao',
        destination: dest,
        notes: `Movimentação rápida via Scanner Mobile.`
      });
      toast.success("Movimentação registrada com sucesso!");
      setScanResult(null);
      setEq(null);
      setTimeout(() => window.location.reload(), 1000); // Reload scanner
    } catch (e) {
      toast.error(e.response?.data?.error || "Erro ao movimentar");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-900 text-white relative">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900/20 opacity-80 pointer-events-none"></div>

      <div className="p-4 border-b border-white/10 flex items-center justify-between glass-dark z-10 relative">
        <button onClick={() => navigate('/')} className="text-amber-500 hover:text-amber-400 p-2 rounded-full hover:bg-white/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold tracking-wide">Scanner Expresso</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-y-auto relative z-10">
        {!scanResult ? (
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-black rounded-3xl overflow-hidden text-black shadow-[0_0_40px_rgba(245,158,11,0.15)] border border-white/10 relative">
              <div className="absolute inset-0 border-4 border-amber-500/30 rounded-3xl pointer-events-none z-20"></div>
              <Scanner
                onScan={handleScan}
                onError={(err) => setError(err?.message || "Erro na câmera")}
                components={{ audio: false, finder: true }}
                styles={{ container: { width: '100%', height: '100%' } }}
              />
            </div>
            {error && <p className="text-red-400 text-center mt-4 text-sm font-semibold bg-red-900/30 p-2 rounded-lg border border-red-500/20">{error}</p>}
            <p className="text-slate-400 text-center mt-8 text-sm flex items-center justify-center gap-2 font-medium bg-black/20 p-3 rounded-xl border border-white/5 backdrop-blur-md">
              <Search size={16} className="text-amber-500"/> Aponte a câmera para a etiqueta
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md glass-dark p-6 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {eq ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-1">Identificado</div>
                  <h2 className="text-2xl font-mono font-bold text-white mb-2">{eq.id}</h2>
                  <p className="text-slate-300 font-medium">{eq.description}</p>
                  <p className="text-slate-500 text-sm mt-1 mb-2">{eq.manufacturer} · {eq.model}</p>
                  <div className="inline-block px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-bold border border-slate-600">
                    Status Atual: <span className="text-white">{eq.status || 'Disponível'}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-slate-400 text-center mb-2">Ações Rápidas (Um Toque)</div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <button onClick={() => navigate(`/?eq=${scanResult.id}&action=defeito`)}
                      className="flex flex-col items-center justify-center gap-2 bg-red-900/40 hover:bg-red-600/60 border border-red-500/50 p-4 rounded-xl transition-all">
                      <AlertCircle size={24} className="text-red-400"/>
                      <span className="text-sm font-bold text-red-100">Registrar Defeito</span>
                    </button>
                    <button onClick={() => navigate(`/?eq=${scanResult.id}&action=status`)}
                      className="flex flex-col items-center justify-center gap-2 bg-amber-900/40 hover:bg-amber-600/60 border border-amber-500/50 p-4 rounded-xl transition-all">
                      <Activity size={24} className="text-amber-400"/>
                      <span className="text-sm font-bold text-amber-100">Mudar Status</span>
                    </button>
                  </div>

                  <div className="text-xs font-semibold text-slate-500 text-center uppercase tracking-wider my-3">Movimentar Físicamente</div>

                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(LOCS).filter(k => k !== (eq.currentLocation || "almoxarifado")).map(dest => (
                      <button key={dest} onClick={() => handleQuickMove(dest)} disabled={loadingAction}
                        className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 border border-transparent p-4 rounded-xl transition-all shadow-md group">
                        <MapPin size={24} style={{ color: LOCS[dest].color }} className="group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">{LOCS[dest].label}</span>
                      </button>
                    ))}
                  </div>

                  <hr className="border-slate-700 my-4" />
                  
                  <button onClick={() => navigate(`/?eq=${scanResult.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">
                    <FileText size={18}/> Ver Histórico e Detalhes
                  </button>
                  <button onClick={() => { setScanResult(null); setEq(null); window.location.reload(); }}
                    className="w-full py-3 bg-transparent text-slate-400 font-bold rounded-xl hover:text-white transition-colors">
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-slate-400 font-medium">Buscando dados no servidor...</p>
                </div>
                <button onClick={() => { setScanResult(null); window.location.reload(); }}
                    className="mt-6 py-2 px-6 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors">
                    Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
