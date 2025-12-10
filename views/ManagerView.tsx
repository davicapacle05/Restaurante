import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Item, ItemType } from '../types';
import { Settings, RefreshCw, Save, Database, Edit, Eye, EyeOff } from 'lucide-react';

const CATEGORIES: { type: ItemType; label: string }[] = [
  { type: 'TAMANHO', label: 'Tamanhos' },
  { type: 'MISTURA', label: 'Misturas (Proteínas)' },
  { type: 'ACOMPANHAMENTO', label: 'Acompanhamentos' },
  { type: 'GUARNICAO', label: 'Guarnições' },
  { type: 'EXTRA', label: 'Extras' },
];

export const ManagerView: React.FC = () => {
  const { items, updateItem, resetDatabase, resetMenu } = useStore();
  const [activeTab, setActiveTab] = useState<'menu' | 'system'>('menu');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary state for the item being edited
  const [editForm, setEditForm] = useState<Partial<Item>>({});

  const startEditing = (item: Item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSave = () => {
    if (editingId && editForm) {
      updateItem(editForm as Item);
      setEditingId(null);
      setEditForm({});
    }
  };

  const toggleVisibility = (item: Item) => {
    updateItem({ ...item, active: !item.active });
  };

  const renderMenuEditor = () => (
    <div className="space-y-8">
      {CATEGORIES.map(category => (
        <div key={category.type} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-lg">{category.label}</h3>
            <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
              {items.filter(i => i.type === category.type).length} itens
            </span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {items.filter(i => i.type === category.type).map(item => {
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <div key={item.id} className="p-4 bg-blue-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                        <input 
                          type="text" 
                          value={editForm.name} 
                          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Estoque Inicial ({item.unit})</label>
                        <input 
                          type="number" 
                          value={editForm.maxStock} 
                          onChange={e => setEditForm(prev => ({ ...prev, maxStock: Number(e.target.value) }))}
                          className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Alerta Mínimo</label>
                        <input 
                          type="number" 
                          value={editForm.minStockAlert} 
                          onChange={e => setEditForm(prev => ({ ...prev, minStockAlert: Number(e.target.value) }))}
                          className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                      >
                        <Save size={18} /> Salvar Alterações
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-gray-50 transition-colors ${!item.active ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        {item.name}
                        {!item.active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Oculto</span>}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Porção: <strong>{item.portionSize}{item.unit}</strong></span>
                        <span>Estoque: <strong>{item.maxStock}</strong></span>
                        <span>Alerta: <strong>{item.minStockAlert}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleVisibility(item)}
                      title={item.active ? "Ocultar no Totem" : "Mostrar no Totem"}
                      className={`p-2 rounded-lg border ${item.active ? 'border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}
                    >
                      {item.active ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                    <button 
                      onClick={() => startEditing(item)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors"
                    >
                      <Edit size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSystemTools = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
          <Database size={24} />
        </div>
        <h3 className="font-bold text-xl mb-2">Limpar Histórico de Pedidos</h3>
        <p className="text-gray-500 mb-6">
          Apaga todos os pedidos registrados no sistema (Totem e Cozinha). Use isso no início do dia.
        </p>
        <button 
          onClick={resetDatabase}
          className="w-full py-3 border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
        >
          Limpar Pedidos
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
          <RefreshCw size={24} />
        </div>
        <h3 className="font-bold text-xl mb-2">Restaurar Cardápio Padrão</h3>
        <p className="text-gray-500 mb-6">
          Reverte todas as alterações de nomes, preços e estoques para a configuração original de fábrica.
        </p>
        <button 
          onClick={resetMenu}
          className="w-full py-3 border-2 border-orange-500 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors"
        >
          Resetar Cardápio
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-6 md:p-10 pb-32">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="text-gray-400" />
            Administração
          </h1>
          <p className="text-gray-500 mt-1">Gerencie o cardápio e configurações do sistema</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`pb-4 px-4 font-bold text-lg transition-colors relative ${activeTab === 'menu' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Editor de Cardápio
          {activeTab === 'menu' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`pb-4 px-4 font-bold text-lg transition-colors relative ${activeTab === 'system' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Ferramentas do Sistema
          {activeTab === 'system' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'menu' ? renderMenuEditor() : renderSystemTools()}
    </div>
  );
};