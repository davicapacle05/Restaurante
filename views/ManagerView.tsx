import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Item, ItemType } from '../types';
import { Settings, RefreshCw, Save, Database, Edit, Eye, EyeOff, BarChart3, TrendingUp, Package, AlertTriangle, Clock, Search } from 'lucide-react';

const CATEGORIES: { type: ItemType; label: string }[] = [
  { type: 'TAMANHO', label: 'Tamanhos' },
  { type: 'MISTURA', label: 'Misturas (Proteínas)' },
  { type: 'ACOMPANHAMENTO', label: 'Acompanhamentos' },
  { type: 'GUARNICAO', label: 'Guarnições' },
  { type: 'EXTRA', label: 'Extras' },
];

export const ManagerView: React.FC = () => {
  const { items, orders, updateItem, resetDatabase, resetMenu } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'system'>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary state for the item being edited
  const [editForm, setEditForm] = useState<Partial<Item>>({});

  // --- Logic Shared with KitchenView for Stock Calculation ---
  const stockData = useMemo(() => {
    // Explicitly type the Map to prevent inference as Map<any, unknown>
    const itemMap = new Map<string, Item>(items.map(i => [i.id, i]));
    const consumption = new Map<string, number>();

    items.forEach(item => consumption.set(item.id, 0));

    orders.forEach(order => {
      order.selectedItems.forEach(orderItem => {
        const currentConfig = itemMap.get(orderItem.id);
        if (currentConfig) {
           const lastRestock = currentConfig.lastRestock || 0;
           if (order.timestamp > lastRestock) {
             const currentConsumed = consumption.get(orderItem.id) || 0;
             consumption.set(orderItem.id, currentConsumed + orderItem.portionSize);
           }
        }
      });
    });

    return items.map(item => {
      const consumed = consumption.get(item.id) || 0;
      const remaining = Math.max(0, item.maxStock - consumed);
      const percentage = (remaining / item.maxStock) * 100;
      return { ...item, consumed, remaining, percentage };
    });
  }, [orders, items]);

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

  const formatValue = (value: number, unit: string) => {
    if (unit === 'g' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}kg`;
    }
    return `${value}${unit}`;
  };

  const renderDashboard = () => {
    const totalOrders = orders.length;
    const paymentStats = orders.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.paymentMethod] = (acc[curr.paymentMethod] || 0) + 1;
      return acc;
    }, {});
    
    // Explicit casting to ensure arithmetic operations are valid in strict mode
    const topPayment = Object.entries(paymentStats).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Total de Pedidos</p>
              <h3 className="text-3xl font-black text-gray-800">{totalOrders}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Itens Monitorados</p>
              <h3 className="text-3xl font-black text-gray-800">{items.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Pagamento Principal</p>
              <h3 className="text-xl font-black text-gray-800 break-all">
                {topPayment ? topPayment[0].replace('_', ' ') : '-'}
              </h3>
              <p className="text-xs text-gray-400">{topPayment ? `${topPayment[1]} pedidos` : ''}</p>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              Níveis de Estoque (Tempo Real)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-500 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Capacidade</th>
                  <th className="px-6 py-3">Restante</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockData.sort((a,b) => a.percentage - b.percentage).map(item => {
                  const isLow = item.remaining <= item.minStockAlert;
                  const isCritical = item.remaining === 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{item.type}</td>
                      <td className="px-6 py-3 text-gray-600 font-mono">{formatValue(item.maxStock, item.unit)}</td>
                      <td className="px-6 py-3 font-mono font-bold">
                        <span className={isCritical ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-emerald-600'}>
                          {formatValue(item.remaining, item.unit)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {isCritical ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                            CRÍTICO
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">
                            BAIXO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Últimos Pedidos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-500 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-3">Horário</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Itens</th>
                  <th className="px-6 py-3">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-600 font-mono">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {order.customerName || 'Balcão'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {order.selectedItems.length} itens
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      Nenhum pedido registrado hoje.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMenuEditor = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
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
      <div className="flex gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
         <button 
          onClick={() => setActiveTab('dashboard')}
          className={`pb-4 px-4 font-bold text-lg transition-colors relative whitespace-nowrap ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Dashboard & Relatórios
          {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`pb-4 px-4 font-bold text-lg transition-colors relative whitespace-nowrap ${activeTab === 'menu' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Editor de Cardápio
          {activeTab === 'menu' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`pb-4 px-4 font-bold text-lg transition-colors relative whitespace-nowrap ${activeTab === 'system' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Ferramentas do Sistema
          {activeTab === 'system' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'menu' && renderMenuEditor()}
      {activeTab === 'system' && renderSystemTools()}
    </div>
  );
};