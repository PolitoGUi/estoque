import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from './MainLayout';
import api from '../api';
import { Database, Image, Settings, Layers, Folder, Download, Upload, Trash2, Plus, Edit2 } from 'lucide-react';

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

  const handleBackupExport = () => {
    window.open(`${api.defaults.baseURL}/backup/export`, '_blank');
  };

  const handleBackupImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('CUIDADO: A restauração substituirá todos os dados atuais. Deseja continuar?')) return;

    const formData = new FormData();
    formData.append('backup', file);

    try {
      alert('Restaurando backup... Aguarde.');
      await api.post('/backup/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Backup restaurado com sucesso! O sistema será recarregado.');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Erro ao restaurar backup.');
    }
  };

  const saveSystemSettings = async () => {
    try {
      await api.post('/settings/system', { key: 'company_name', value: systemState.company_name });
      await api.post('/settings/system', { key: 'company_logo', value: systemState.company_logo });
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar configurações.');
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
            alert('Gerando dados... Aguarde.');
            await api.post('/settings/seed-test');
            alert('Dados de teste gerados com sucesso!');
            window.location.reload();
          } catch (err) {
            alert('Erro ao gerar dados de teste.');
          }
        }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 shadow-sm transition-colors">
          <Database size={16} /> Gerar Dados de Teste (Mock)
        </button>
      </div>
    </div>
  );

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
                <button className="text-slate-400 hover:text-amber-500 mr-2"><Edit2 size={16}/></button>
                <button className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
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
              { k: 'categories', l: 'Categorias', Icon: Layers },
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
                {activeTab === 'categories' && (
                  <div>
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Categorias</h3><button className="flex items-center gap-1 text-sm bg-amber-500 text-white px-3 py-1.5 rounded"><Plus size={16}/>Nova</button></div>
                    {renderTable(data.categories, [{k: 'name', l: 'Nome'}], 'category')}
                  </div>
                )}
                {activeTab === 'manufacturers' && (
                  <div>
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Fabricantes</h3><button className="flex items-center gap-1 text-sm bg-amber-500 text-white px-3 py-1.5 rounded"><Plus size={16}/>Nova</button></div>
                    {renderTable(data.manufacturers, [{k: 'name', l: 'Nome'}], 'manufacturer')}
                  </div>
                )}
                {activeTab === 'models' && (
                  <div>
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Modelos</h3><button className="flex items-center gap-1 text-sm bg-amber-500 text-white px-3 py-1.5 rounded"><Plus size={16}/>Novo</button></div>
                    {renderTable(data.models, [{k: 'name', l: 'Nome'}], 'model')}
                  </div>
                )}
                {activeTab === 'locations' && (
                  <div>
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Locais</h3><button className="flex items-center gap-1 text-sm bg-amber-500 text-white px-3 py-1.5 rounded"><Plus size={16}/>Novo</button></div>
                    {renderTable(data.locations, [{k: 'label', l: 'Nome do Local'}, {k: 'key', l: 'Identificador (Key)'}], 'location')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
