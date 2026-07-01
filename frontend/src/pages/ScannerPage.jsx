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
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <button onClick={() => navigate('/')} className="text-amber-500 hover:text-amber-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold">Scanner Expresso</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-y-auto">
        {!scanResult ? (
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-lg overflow-hidden text-black shadow-2xl border-4 border-slate-800">
              <Scanner
                onScan={handleScan}
                onError={(err) => setError(err?.message || "Erro na câmera")}
                components={{ audio: false, finder: true }}
                styles={{ container: { width: '100%', height: '100%' } }}
              />
            </div>
            {error && <p className="text-red-500 text-center mt-4 text-sm font-semibold">{error}</p>}
            <p className="text-slate-400 text-center mt-6 text-sm flex items-center justify-center gap-2">
              <Search size={16}/> Aponte a câmera para a etiqueta do equipamento
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
                    <button onClick={() => handleQuickMove('campo')} disabled={loadingAction}
                      className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-green-600/20 hover:border-green-500 border border-transparent p-4 rounded-xl transition-all">
                      <MapPin size={24} className="text-green-500"/>
                      <span className="text-sm font-bold">Em Campo</span>
                    </button>
                    <button onClick={() => handleQuickMove('laboratorio')} disabled={loadingAction}
                      className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-purple-600/20 hover:border-purple-500 border border-transparent p-4 rounded-xl transition-all">
                      <MapPin size={24} className="text-purple-500"/>
                      <span className="text-sm font-bold">Laboratório</span>
                    </button>
                    <button onClick={() => handleQuickMove('almoxarifado')} disabled={loadingAction}
                      className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-blue-600/20 hover:border-blue-500 border border-transparent p-4 rounded-xl transition-all">
                      <MapPin size={24} className="text-blue-500"/>
                      <span className="text-sm font-bold">Almoxarifado</span>
                    </button>
                    <button onClick={() => handleQuickMove('sucata')} disabled={loadingAction}
                      className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-red-600/20 hover:border-red-500 border border-transparent p-4 rounded-xl transition-all">
                      <MapPin size={24} className="text-red-500"/>
                      <span className="text-sm font-bold">Sucatear</span>
                    </button>
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
