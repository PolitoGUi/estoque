import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from './MainLayout';
import api from '../api';
import { Modal } from '../components/Modal';
import { Database, Settings, Layers, Folder, Download, Upload, Trash2, Plus, Edit2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [data, setData] = useState({ categories: [], manufacturers: [], models: [], locations: [], system: [] });
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [taxRes, sysRes] = await Promise.all([
        api.get('/settings/taxonomy'),
        api.get('/settings/system')
      ]);
      setData({ ...taxRes.data, system: sysRes.data });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [systemState, setSystemState] = useState({ company_name: '', company_logo: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (data.system) {
      setSystemState({
        company_name: data.system.find(s => s.key === 'company_name')?.value || '',
        company_logo: data.system.find(s => s.key === 'company_logo')?.value || '',
      });
    }
  }, [data.system]);

  const handleBackupExport = async () => {
    try {
      toast.loading("Gerando backup, aguarde...", { id: 'backup' });
      const res = await api.get('/backup/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${new Date().toISOString().slice(0,10)}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Backup gerado com sucesso!", { id: 'backup' });
    } catch(err) {
      toast.error("Erro ao exportar backup: " + (err.response?.data?.error || err.message), { id: 'backup' });
    }
  };

  const handleBackupImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('CUIDADO: A restauração substituirá todos os dados atuais. Deseja continuar?')) return;

    const formData = new FormData();
    formData.append('backup', file);

    try {
      toast.loading('Restaurando backup... Aguarde.', { id: 'import' });
      await api.post('/backup/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Backup restaurado com sucesso! Recarregando...', { id: 'import' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao restaurar backup.', { id: 'import' });
    }
  };

  const saveSystemSettings = async () => {
    try {
      await api.post('/settings/system', { key: 'company_name', value: systemState.company_name });
      await api.post('/settings/system', { key: 'company_logo', value: systemState.company_logo });
      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar configurações.');
    }
  };

  const renderSystemTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800 border-b border-gray-200 pb-2">Sistema e Aparência</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-semibold text-slate-600 block mb-1">Nome da Empresa</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" 
            value={systemState.company_name}
            onChange={e => setSystemState({ ...systemState, company_name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-600 block mb-1">Logo URL</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" 
            value={systemState.company_logo}
            onChange={e => setSystemState({ ...systemState, company_logo: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
      <button onClick={saveSystemSettings} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 shadow-sm transition-colors">Salvar Alterações</button>

      <h3 className="text-lg font-bold text-slate-800 border-b border-gray-200 pb-2 mt-8 pt-4">Backup e Restauração</h3>
      <div className="flex gap-4">
        <button onClick={handleBackupExport} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700">
          <Download size={16} /> Exportar Backup (SQL)
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200">
          <Upload size={16} /> Importar e Sobrescrever
        </button>
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleBackupImport} accept=".sql" />
      </div>

      <h3 className="text-lg font-bold text-slate-800 border-b border-gray-200 pb-2 mt-8 pt-4">Ambiente de Testes</h3>
      <div className="flex gap-4">
        <button onClick={async () => {
          if (!window.confirm('Isso vai adicionar 10 equipamentos fictícios e várias movimentações no banco. Continuar?')) return;
          try {
            toast.loading('Gerando dados... Aguarde.', { id: 'seed' });
            await api.post('/settings/seed-test');
            toast.success('Dados de teste gerados com sucesso!', { id: 'seed' });
            setTimeout(() => window.location.reload(), 1500);
          } catch (err) {
            toast.error('Erro ao gerar dados de teste.', { id: 'seed' });
          }
        }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 shadow-sm transition-colors">
          <Database size={16} /> Gerar Dados de Teste (Mock)
        </button>
      </div>
    </div>
  );

  const [taxonomyModal, setTaxonomyModal] = useState({ open: false, type: null, title: '' });
  const [taxInput, setTaxInput] = useState('');
  
  const handleCreateTaxonomy = async (e) => {
    e.preventDefault();
    if (!taxInput.trim()) return;
    try {
      const endpointMap = {
        'category': '/settings/categories',
        'manufacturer': '/settings/manufacturers',
        'model': '/settings/models',
        'location': '/settings/locations',
      };
      
      const payload = taxonomyModal.type === 'location' 
        ? { key: taxInput.toLowerCase().replace(/\s+/g, '-'), label: taxInput }
        : { name: taxInput };
        
      await api.post(endpointMap[taxonomyModal.type], payload);
      toast.success('Item cadastrado com sucesso!');
      setTaxonomyModal({ open: false, type: null, title: '' });
      setTaxInput('');
      loadSettings();
    } catch(err) {
      toast.error("Erro ao criar: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteTaxonomy = async (type, id) => {
    if (!window.confirm('Tem certeza que deseja remover este item?')) return;
    try {
      const endpointMap = {
        'category': '/settings/categories',
        'manufacturer': '/settings/manufacturers',
        'model': '/settings/models',
        'location': '/settings/locations',
      };
      await api.delete(`${endpointMap[type]}/${id}`);
      toast.success('Removido com sucesso!');
      loadSettings();
    } catch(err) {
      toast.error("Erro ao remover: " + (err.response?.data?.error || err.message));
    }
  };

  const renderTable = (items, columns, entity) => (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-gray-200">
          <tr>
            {columns.map(c => <th key={c.k} className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs">{c.l}</th>)}
            <th className="px-4 py-3 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(item => (
            <tr key={item.id || item.key} className="hover:bg-slate-50 transition-colors">
              {columns.map(c => <td key={c.k} className="px-4 py-3 text-slate-600">{item[c.k]}</td>)}
              <td className="px-4 py-3 text-right">
                <button onClick={() => handleDeleteTaxonomy(entity, item.id || item.key)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <MainLayout view="settings">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Configurações</h2>
            <p className="text-sm text-slate-400 mt-0.5">Gerenciamento dinâmico e backup</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Tabs Nav */}
          <div className="w-64 shrink-0 bg-white border border-gray-200 rounded-xl p-2 space-y-1 h-fit">
            {[
              { k: 'system', l: 'Sistema & Backup', Icon: Settings },
              { k: 'manufacturers', l: 'Fabricantes', Icon: Folder },
              { k: 'models', l: 'Modelos', Icon: Database },
              { k: 'locations', l: 'Locais', Icon: MapPin },
            ].map(t => (
              <button key={t.k} onClick={() => setActiveTab(t.k)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${activeTab === t.k ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                <t.Icon size={18} /> {t.l}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 min-h-[500px]">
            {loading ? (
              <div className="py-12 text-center text-slate-400 animate-pulse">Carregando configurações...</div>
            ) : (
              <>
                {activeTab === 'system' && renderSystemTab()}

                {activeTab === 'manufacturers' && (
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">Fabricantes</h3>
                      <button onClick={() => setTaxonomyModal({ open: true, type: 'manufacturer', title: 'Novo Fabricante' })} className="flex items-center gap-1 text-sm bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition-colors"><Plus size={16}/>Nova</button>
                    </div>
                    {renderTable(data.manufacturers, [{k: 'name', l: 'Nome'}], 'manufacturer')}
                  </div>
                )}
                {activeTab === 'models' && (
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">Modelos</h3>
                      <button onClick={() => setTaxonomyModal({ open: true, type: 'model', title: 'Novo Modelo' })} className="flex items-center gap-1 text-sm bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition-colors"><Plus size={16}/>Novo</button>
                    </div>
                    {renderTable(data.models, [{k: 'name', l: 'Nome'}], 'model')}
                  </div>
                )}
                {activeTab === 'locations' && (
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">Locais</h3>
                      <button onClick={() => setTaxonomyModal({ open: true, type: 'location', title: 'Novo Local' })} className="flex items-center gap-1 text-sm bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition-colors"><Plus size={16}/>Novo</button>
                    </div>
                    {renderTable(data.locations, [{k: 'label', l: 'Nome do Local'}, {k: 'key', l: 'Identificador (Key)'}], 'location')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {taxonomyModal.open && (
        <Modal title={taxonomyModal.title} onClose={() => setTaxonomyModal({ open: false, type: null, title: '' })}>
          <form onSubmit={handleCreateTaxonomy} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome</label>
              <input required autoFocus value={taxInput} onChange={e => setTaxInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setTaxonomyModal({ open: false, type: null, title: '' })} className="flex-1 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 py-2 font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors">Salvar Item</button>
            </div>
          </form>
        </Modal>
      )}
    </MainLayout>
  );
};
