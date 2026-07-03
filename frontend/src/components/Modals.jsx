import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Tag, X, Calendar, User, Key, MapPin, CheckSquare, Plus, Check } from 'lucide-react';
import api from '../api';
import { LOCS, OBS_CATS } from '../constants';
import { genId } from '../utils/helpers';
import { Modal } from './Modal';
import { LocBadge } from './MicroComponents';

import { toast } from 'react-hot-toast';

export const MoveModal = ({ e, onSave, onClose }) => {
  const origin = e.currentLocation || "almoxarifado";
  const dests  = Object.keys(LOCS).filter(k => k !== origin);
  const [dest, setDest] = useState(dests[0] || "");
  const [notes,  setNotes]  = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const typeMap = {
      almoxarifado: origin === "campo" ? "retorno_campo" : "entrada_estoque",
      laboratorio:  "envio_laboratorio",
      campo:        "envio_campo",
      manutencao:   "transferencia",
      sucata:       "sucata",
    };
    
    setLoading(true);
    try {
      await api.post('/events', { 
        equipmentId: e.id,
        type: typeMap[dest] || "transferencia", 
        origin, 
        destination: dest, 
        notes,
        expectedVersion: e.version // OCC Validation
      });
      toast.success("Movimentação registrada com sucesso!");
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao movimentar equipamento. A versão pode estar desatualizada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Movimentar ${e.id}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-sm text-slate-600 font-medium">{e.description}</div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-1.5">Origem</div>
            <LocBadge loc={origin}/>
          </div>
          <ArrowRight size={16} className="text-gray-300 mt-4"/>
          <div className="flex-1">
            <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-1.5">Destino</div>
            <select value={dest} onChange={ev => setDest(ev.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              {dests.map(k => <option key={k} value={k}>{LOCS[k].label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-1.5">Observação</div>
          <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            rows={3} placeholder="Motivo, projeto, planta de destino..."
            value={notes} onChange={ev => setNotes(ev.target.value)}/>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={save} disabled={loading}
            className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm">
            {loading ? 'Salvando...' : 'Confirmar Movimentação'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const ObsModal = ({ e, initCat, onSave, onClose }) => {
  const [cat,  setCat]  = useState(initCat || "observacao");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post('/observations', { equipmentId: e.id, category: cat, text });
      toast.success("Registro adicionado com sucesso!");
      onSave();
      onClose();
    } catch (err) {
      toast.error("Erro ao registrar observação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Registrar ${OBS_CATS[cat]?.label || 'Registro'} — ${e.id}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-sm text-slate-500">{e.description}</div>
        <div>
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-2">Categoria</div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(OBS_CATS).map(([k,v]) => (
              <button key={k} onClick={() => setCat(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  cat === k ? v.cls : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-1.5">Descrição</div>
          <textarea
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            rows={4} placeholder="Descreva o defeito, teste, reparo ou observação com detalhes..."
            value={text} onChange={ev => setText(ev.target.value)}/>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={save} disabled={!text.trim() || loading}
            className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 transition-colors shadow-sm">
            {loading ? 'Salvando...' : 'Salvar Registro'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const ConfirmDialog = ({ title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", danger = false }) => {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onCancel(); }}
            className={`flex-1 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ComboBox = ({ value, onChange, options, onBlur, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState(options);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setFiltered(options.filter(o => o.toLowerCase().includes(e.target.value.toLowerCase())));
          setOpen(true);
        }}
        onFocus={() => {
          setFiltered(options.filter(o => o.toLowerCase().includes(value.toLowerCase())));
          setOpen(true);
        }}
        onBlur={onBlur}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(o => (
            <div key={o}
              className="px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 cursor-pointer transition-colors"
              onMouseDown={(e) => {
                e.preventDefault(); 
                onChange(o);
                setOpen(false);
                if (onBlur) setTimeout(onBlur, 50);
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const NewEqModal = ({ eqList, onSave, onClose, initialData = {} }) => {
  const newId = genId(eqList);
  const [f, setF] = useState({
    description: initialData.description || "",
    model: initialData.model || "",
    manufacturer: initialData.manufacturer || "",
    category: initialData.category || "CLP",
    serial: initialData.serial || "",
    patrimony: initialData.patrimony || "",
    notes: initialData.notes || ""
  });
  const [loading, setLoading] = useState(false);
  const set   = (k, v) => setF(p => ({...p, [k]: v}));
  const valid = f.description && f.model && f.manufacturer;
  const CATS  = ["CLP","Módulo I/O","Fonte","Sensor","Drive","Relé","IHM","Outros"];

  const save = async () => {
    if (!valid) return;
    setLoading(true);
    try {
      await api.post('/equipments', { id: newId, ...f });
      toast.success("Equipamento cadastrado com sucesso!");
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  const knownModels = Array.from(new Set(eqList.map(e => e.model).filter(Boolean)));

  const handleModelBlur = () => {
    if (!f.model) return;
    const existing = eqList.find(e => e.model?.trim().toLowerCase() === f.model.trim().toLowerCase());
    if (existing) {
      let updated = false;
      const nextF = { ...f };
      if (!nextF.description && existing.description) { nextF.description = existing.description; updated = true; }
      if (!nextF.manufacturer && existing.manufacturer) { nextF.manufacturer = existing.manufacturer; updated = true; }
      if (nextF.category === "CLP" && existing.category && existing.category !== "CLP") { nextF.category = existing.category; updated = true; }
      
      if (updated) {
        setF(nextF);
        toast.success("Dados preenchidos automaticamente com base no modelo!");
      }
    }
  };

  return (
    <Modal title="Cadastrar Equipamento" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <Tag size={13} className="text-amber-600 shrink-0"/>
          <span className="text-xs text-amber-700">
            ID sugerido: <span className="font-mono font-bold text-amber-800">{newId}</span>
          </span>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Descrição *</label>
          <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="CLP Siemens S7-300" value={f.description} onChange={ev => set("description", ev.target.value)}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Fabricante *</label>
            <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Siemens" value={f.manufacturer} onChange={ev => set("manufacturer", ev.target.value)}/>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Modelo *</label>
            <ComboBox 
              options={knownModels}
              placeholder="CPU 315-2 DP"
              value={f.model}
              onChange={val => set("model", val)}
              onBlur={handleModelBlur}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Categoria *</label>
            <select className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={f.category} onChange={ev => set("category", ev.target.value)}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Patrimônio</label>
            <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="PAT-2024-XXXX" value={f.patrimony} onChange={ev => set("patrimony", ev.target.value)}/>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Nº de Série</label>
            <input className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="(opcional — deixe vazio se ilegível)" value={f.serial} onChange={ev => set("serial", ev.target.value)}/>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Observações iniciais</label>
          <textarea className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            rows={2} placeholder="NF de compra, origem, condição no recebimento..."
            value={f.notes} onChange={ev => set("notes", ev.target.value)}/>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={save} disabled={!valid || loading}
            className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 transition-colors shadow-sm">
            {loading ? 'Cadastrando...' : 'Cadastrar Equipamento'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const StatusModal = ({ e, onSave, onClose }) => {
  const [status, setStatus] = useState(e.status || "Disponível");
  const [loading, setLoading] = useState(false);
  const statusOptions = ["Disponível", "Reservado", "Em uso", "Em manutenção", "Aguardando peça", "Sucateado"];

  const save = async () => {
    setLoading(true);
    try {
      await api.put(`/equipments/${e.id}/status`, { status });
      toast.success("Status atualizado com sucesso!");
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao atualizar status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Mudar Status — ${e.id}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-sm text-slate-600 font-medium">{e.description}</div>
        <div>
          <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-1.5">Estado Operacional</div>
          <select value={status} onChange={ev => setStatus(ev.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={save} disabled={loading}
            className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm">
            {loading ? 'Salvando...' : 'Salvar Status'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

import { QRCodeCanvas } from 'qrcode.react';

export const QRCodeModal = ({ e, onClose }) => {
  const qrData = JSON.stringify({ id: e.id, v: 1 });

  return (
    <Modal title={`QR Code — ${e.id}`} onClose={onClose}>
      <div className="flex flex-col items-center justify-center space-y-4 p-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <QRCodeCanvas id="qr-canvas-download" value={qrData} size={200} level="H" includeMargin />
        </div>
        <p className="text-sm text-slate-500 text-center">
          Escaneie este código pelo aplicativo móvel para acessar o equipamento rapidamente.
        </p>
        <button onClick={() => {
            const canvas = document.getElementById("qr-canvas-download");
            if (!canvas) return;
            const pngUrl = canvas.toDataURL("image/png");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `QR_${e.id}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }}
          className="w-full py-2.5 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-sm">
          Baixar Imagem (PNG)
        </button>
      </div>
    </Modal>
  );
};
