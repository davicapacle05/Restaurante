import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Item, ItemType } from '../types';
import { Settings, RefreshCw, Save, Database, Edit, Eye, EyeOff, BarChart3, TrendingUp, Package, AlertTriangle, Clock, Search, PlusCircle, ArrowDownCircle, Boxes, Calendar, X, ChefHat, ShoppingBasket, CupSoda, Plus } from 'lucide-react';

const CATEGORIES: { type: ItemType; label: string }[] = [
  { type: 'TAMANHO', label: 'Tamanhos (Embalagens)' },
  { type: 'MISTURA', label: 'Proteínas (Carnes/Ovos)' },
  { type: 'ACOMPANHAMENTO', label: 'Acompanhamentos (Arroz/Feijão)' },
  { type: 'GUARNICAO', label: 'Guarnições (Legumes/Saladas)' },
  { type: 'BEBIDA', label: 'Bebidas (Geladeira)' },
  { type: 'EXTRA', label: 'Insumos Extras & Descartáveis' },
];

export const ManagerView: React.FC = () => {
  const { items, orders, updateItem, createItem, addStock, resetDatabase, resetMenu } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'menu' | 'system'>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary state for the item being edited (Menu Editor)
  const [editForm, setEditForm] = useState<Partial<Item>>({});

  // State for Stock Replenishment inputs
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});

  // State for History Viewer
  const [viewingHistory, setViewingHistory] = useState<Item | null>(null);

  // State for Creating New Item
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState<Partial<Item>>({
    type: 'MISTURA',
    unit: 'un',
    price: 0,
    active: false, // Default to hidden/internal only
    portionSize: 1,
    minStockAlert: 5,
    maxStock: 0,
    hasDelay: false
  });

  // --- Logic Shared with KitchenView for Stock Calculation ---
  const stockData = useMemo(() => {
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

  // --- History Data Calculation ---
  const historyData = useMemo(() => {
    if (!viewingHistory) return [];

    const days = [];
    const today = new Date();
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const fullDate = d.getTime();
      const nextDay = fullDate + 86400000; // +1 day in ms

      // Calculate consumption for this specific day
      let count = 0;
      orders.forEach(order => {
        if (order.timestamp >= fullDate && order.timestamp < nextDay) {
          // Count how many times this item appears in this order
          const occurrences = order.selectedItems.filter(i => i.id === viewingHistory.id).length;
          count += occurrences;
        }
      });

      days.push({ date: dateStr, count, dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }) });
    }
    return days;
  }, [viewingHistory, orders]);

  // --- Actions ---

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

  const handleCreateItem = () => {
    if (!newItemForm.name) {
      alert("Por favor, preencha o Nome no Cardápio.");
      return;
    }

    // Default stockName to name if empty
    const finalItem = {
      ...newItemForm,
      stockName: newItemForm.stockName || newItemForm.name,
      portionSize: newItemForm.portionSize || 1 // Ensure portionSize is at least 1
    };

    createItem(finalItem as Omit<Item, 'id'>);
    setIsCreatingItem(false);
    
    // Auto-navigate to the relevant tab so user sees their new item
    if (finalItem.active) {
      setActiveTab('menu');
    } else {
      setActiveTab('stock');
    }

    // Reset Form
    setNewItemForm({
      type: 'MISTURA',
      unit: 'un',
      price: 0,
      active: false,
      portionSize: 1,
      minStockAlert: 5,
      maxStock: 0,
      hasDelay: false,
      name: '',
      stockName: ''
    });
  };

  const toggleVisibility = (item: Item) => {
    updateItem({ ...item, active: !item.active });
  };

  const handleAddStock = (itemId: string) => {
    const qty = parseInt(stockInputs[itemId]);
    if (qty && !isNaN(qty)) {
      addStock(itemId, qty);
      setStockInputs(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'g' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}kg`;
    }
    return `${value}${unit}`;
  };

  // --- Views ---

  const renderNewItemModal = () => {
    if (!isCreatingItem) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="bg-green-600 p-6 text-white flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PlusCircle size={24} />
              Cadastrar Novo Item/Insumo
            </h2>
            <button onClick={() => setIsCreatingItem(false)} className="hover:bg-green-700 p-2 rounded-full">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.type}
                      onClick={() => setNewItemForm(prev => ({ ...prev, type: cat.type }))}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                        newItemForm.type === cat.type 
                          ? 'bg-green-100 border-green-500 text-green-700' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {cat.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome no Cardápio <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={newItemForm.name || ''}
                  onChange={e => setNewItemForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  placeholder="Ex: Bife Acebolado"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome de Estoque (Opcional)</label>
                <input 
                  type="text"
                  value={newItemForm.stockName || ''}
                  onChange={e => setNewItemForm(prev => ({ ...prev, stockName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  placeholder="Ex: Contra-filé Cru (se diferente)"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Preço de Venda (R$)</label>
                <input 
                  type="number"
                  step="0.50"
                  value={newItemForm.price}
                  onChange={e => setNewItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                />
                <p className="text-xs text-gray-400 mt-1">Deixe 0 se for item incluso na marmita.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Estoque Inicial (Quantidade)</label>
                <input 
                  type="number"
                  value={newItemForm.maxStock}
                  onChange={e => setNewItemForm(prev => ({ ...prev, maxStock: parseFloat(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-green-50 font-bold text-green-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Unidade de Medida</label>
                <select 
                  value={newItemForm.unit}
                  onChange={e => setNewItemForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                >
                  <option value="un">Unidade (un)</option>
                  <option value="g">Gramas (g)</option>
                  <option value="kg">Quilos (kg)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="L">Litros (L)</option>
                  <option value="porção">Porção</option>
                  <option value="kit">Kit</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tamanho da Porção de Consumo</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={newItemForm.portionSize}
                    onChange={e => setNewItemForm(prev => ({ ...prev, portionSize: parseFloat(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                    {newItemForm.unit}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Quanto é descontado do estoque a cada venda.</p>
              </div>

               <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Alerta de Estoque Mínimo</label>
                <input 
                  type="number"
                  value={newItemForm.minStockAlert}
                  onChange={e => setNewItemForm(prev => ({ ...prev, minStockAlert: parseFloat(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                />
              </div>

              <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-gray-100">
                <input 
                  type="checkbox"
                  id="activeCheck"
                  checked={newItemForm.active}
                  onChange={e => setNewItemForm(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="activeCheck" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-bold block">Disponível no Totem?</span>
                  <span className="text-xs text-gray-500">Marque se este item deve aparecer para os clientes comprarem/selecionarem. Desmarque se for apenas controle interno.</span>
                </label>
              </div>

            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
            <button 
              onClick={() => setIsCreatingItem(false)}
              className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCreateItem}
              className="px-6 py-3 font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <Save size={20} />
              Salvar Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryModal = () => {
    if (!viewingHistory) return null;

    const maxCount = Math.max(...historyData.map(d => d.count), 1); // Avoid div by zero
    const totalPeriod = historyData.reduce((acc, curr) => acc + curr.count, 0);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Histórico de Consumo</p>
              <h2 className="text-2xl font-bold">{viewingHistory.name}</h2>
              <p className="text-sm opacity-90 mt-1">Últimos 7 dias</p>
            </div>
            <button 
              onClick={() => setViewingHistory(null)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
               <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                 <TrendingUp size={32} />
               </div>
               <div>
                 <p className="text-gray-500 text-sm font-bold uppercase">Total Vendido (7 dias)</p>
                 <p className="text-4xl font-black text-gray-800">{totalPeriod} <span className="text-base font-medium text-gray-400">unidades</span></p>
               </div>
            </div>

            {/* CSS Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2">
              {historyData.map((day, idx) => {
                const heightPercent = (day.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="relative w-full flex justify-center items-end h-full">
                       {/* Bar */}
                       <div 
                        className="w-full bg-blue-100 rounded-t-lg transition-all duration-500 group-hover:bg-blue-200 relative"
                        style={{ height: `${heightPercent}%` }}
                       >
                         {/* Tooltip on Hover */}
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                           {day.count} un
                         </div>
                       </div>
                    </div>
                    {/* Label */}
                    <div className="text-center">
                      <span className="text-[10px] text-gray-400 font-bold block uppercase">{day.dayName.replace('.', '')}</span>
                      <span className="text-[10px] text-gray-500 font-bold">{day.date.split('/')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
             <button 
               onClick={() => setViewingHistory(null)}
               className="text-gray-500 hover:text-gray-800 font-bold text-sm"
             >
               Fechar
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const totalOrders = orders.length;
    const paymentStats = orders.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.paymentMethod] = (acc[curr.paymentMethod] || 0) + 1;
      return acc;
    }, {});
    
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

  const renderStockList = (items: typeof stockData, title: string, icon: React.ReactNode, isIngredient = false) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${isIngredient ? 'bg-orange-50' : 'bg-gray-50'}`}>
        <h3 className={`font-bold text-lg flex items-center gap-2 ${isIngredient ? 'text-orange-900' : 'text-gray-700'}`}>
          {icon} {title}
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {items.map(item => {
          const isLow = item.remaining <= item.minStockAlert;
          
          return (
            <div key={item.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center group hover:bg-gray-50 transition-colors">
              
              {/* Item Info */}
              <div className="md:col-span-5">
                <h4 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  {item.stockName || item.name}
                  {isLow && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Estoque Baixo</span>}
                </h4>
                {item.stockName && (
                  <span className="text-xs text-gray-400 block mt-1 font-medium">
                     Utilizado em: {item.name}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  Unidade: {item.unit} | Porção: {item.portionSize}{item.unit}
                </span>
              </div>

              {/* Current Status */}
              <div className="md:col-span-3 flex flex-col justify-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Disponível</span>
                <span className={`text-xl font-mono font-bold ${isLow ? 'text-orange-500' : 'text-emerald-600'}`}>
                  {formatValue(item.remaining, item.unit)}
                </span>
              </div>

              {/* Input Action */}
              <div className="md:col-span-4 flex items-center gap-2">
                <div className="relative flex-grow">
                  <input 
                    type="number"
                    placeholder="Qtd entrada"
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                    value={stockInputs[item.id] || ''}
                    onChange={(e) => setStockInputs(prev => ({...prev, [item.id]: e.target.value}))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStock(item.id)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                    {item.unit}
                  </span>
                </div>
                <button 
                  onClick={() => handleAddStock(item.id)}
                  disabled={!stockInputs[item.id]}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <PlusCircle size={18} />
                  <span className="hidden sm:inline">Lançar</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStockManagement = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-4 flex-1">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Boxes size={24} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-lg">Gestão de Estoque & Insumos</h3>
            <p className="text-blue-700 mt-1 text-sm">
               Controle a entrada de mercadorias. Lance a quantidade que chegou do fornecedor aqui.
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsCreatingItem(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <PlusCircle size={24} />
          <span>Novo Item/Insumo</span>
        </button>
      </div>

      {renderStockList(
        stockData.filter(i => ['MISTURA', 'GUARNICAO', 'ACOMPANHAMENTO', 'TAMANHO'].includes(i.type)), 
        'Ingredientes & Embalagens (Cozinha)', 
        <ChefHat size={20} />,
        true
      )}

      {renderStockList(
        stockData.filter(i => ['BEBIDA', 'EXTRA'].includes(i.type)), 
        'Bebidas & Extras (Geladeira/Balcão)', 
        <ShoppingBasket size={20} />
      )}
    </div>
  );

  const renderMenuEditor = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-8 flex items-start gap-4">
        <div className="bg-amber-100 p-3 rounded-full text-amber-600">
          <Edit size={24} />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 text-lg">Editor de Cardápio</h3>
          <p className="text-amber-700 mt-1">
             Aqui você altera <strong>Preços, Nomes e Visibilidade</strong>. 
             Para repor ingredientes ou alterar quantidades disponíveis, use a aba "Estoque & Insumos".
          </p>
        </div>
      </div>

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
                        <label className="text-xs font-bold text-gray-500 uppercase">Nome no Cardápio</label>
                        <input 
                          type="text" 
                          value={editForm.name} 
                          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Preço (R$)</label>
                        <input 
                          type="number"
                          step="0.50"
                          min="0"
                          value={editForm.price} 
                          onChange={e => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                          className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Alerta de Baixo Estoque</label>
                        <input 
                          type="number" 
                          value={editForm.minStockAlert} 
                          onChange={e => setEditForm(prev => ({ ...prev, minStockAlert: Number(e.target.value) }))}
                          className="w-full mt-1 p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 shadow-sm"
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
                        {item.price > 0 && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 rounded border border-emerald-100">
                            R$ {item.price.toFixed(2)}
                          </span>
                        )}
                        <span>Alerta Mínimo: <strong>{item.minStockAlert}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setViewingHistory(item)}
                      title="Ver Histórico de Consumo"
                      className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors"
                    >
                      <Calendar size={20} />
                    </button>
                    <button 
                      onClick={() => toggleVisibility(item)}
                      title={item.active ? "Ocultar no Totem" : "Mostrar no Totem"}
                      className={`p-2 rounded-lg border ${item.active ? 'border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}
                    >
                      {item.active ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                    <button 
                      onClick={() => startEditing(item)}
                      title="Editar Item"
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
          onClick={() => setActiveTab('stock')}
          className={`pb-4 px-4 font-bold text-lg transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'stock' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Boxes size={18} />
          Estoque & Insumos
          {activeTab === 'stock' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
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
      {activeTab === 'stock' && renderStockManagement()}
      {activeTab === 'menu' && renderMenuEditor()}
      {activeTab === 'system' && renderSystemTools()}
      
      {renderHistoryModal()}
      {renderNewItemModal()}
    </div>
  );
};