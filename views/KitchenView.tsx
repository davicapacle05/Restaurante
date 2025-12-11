import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ItemType, Item } from '../types';
import { PackageOpen, CheckCircle2, RefreshCw, Clock, AlertTriangle } from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, items: availableItems, updateItem } = useStore();

  // Create a map for O(1) access to the LATEST item configuration (including lastRestock)
  // This ensures we always compare against the most recent restock timestamp
  const itemMap = useMemo(() => {
    return new Map(availableItems.map(i => [i.id, i]));
  }, [availableItems]);

  const stockStatus = useMemo(() => {
    const consumption = new Map<string, number>();

    // Initialize all tracked items with 0
    availableItems.forEach(item => {
      consumption.set(item.id, 0);
    });

    // Iterate through all orders to calculate consumption
    orders.forEach(order => {
      order.selectedItems.forEach(orderItem => {
        // Get the CURRENT config for this item from our fresh map
        const currentConfig = itemMap.get(orderItem.id);
        
        // If item exists in current menu
        if (currentConfig) {
           const lastRestock = currentConfig.lastRestock || 0;
           
           // Only count this order if it happened STRICTLY AFTER the last restock
           // This is the core logic: clicking restock sets lastRestock to Date.now()
           // So all previous orders (timestamp < Date.now()) are ignored.
           if (order.timestamp > lastRestock) {
             const currentConsumed = consumption.get(orderItem.id) || 0;
             consumption.set(orderItem.id, currentConsumed + orderItem.portionSize);
           }
        }
      });
    });

    return consumption;
  }, [orders, itemMap, availableItems]);

  const handleRestock = (item: Item) => {
    // We add 1ms buffer just to be absolutely safe mathematically against orders created in the exact same millisecond
    const newRestockTime = Date.now() + 1; 

    if (confirm(`Confirmar reposição de ${item.name}? O contador será zerado.`)) {
      updateItem({ ...item, lastRestock: newRestockTime });
    }
  };

  const getItemsByType = (type: ItemType) => {
    return availableItems.filter(i => i.type === type);
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'g' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}kg`;
    }
    return `${value}${unit}`;
  };

  const renderCategory = (title: string, type: ItemType) => (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 text-slate-200 uppercase tracking-wider border-b border-slate-700 pb-3">
        {title}
      </h2>
      <div className="space-y-4 flex-grow">
        {getItemsByType(type).map(item => {
          const batchSize = item.maxStock; 
          const consumed = stockStatus.get(item.id) || 0;
          const remaining = Math.max(0, batchSize - consumed);
          const percentage = Math.min(100, Math.max(0, (remaining / batchSize) * 100));
          
          const isLowStock = remaining <= item.minStockAlert;
          const isCritical = remaining === 0;

          // Unique key to force re-render when critical values change
          const componentKey = `${item.id}-${item.lastRestock || 'init'}-${consumed}`;

          return (
            <div key={componentKey} className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${isLowStock ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-700/30 border-slate-600'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-100 font-bold block text-lg">{item.name}</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">
                      Capacidade: {formatValue(batchSize, item.unit)}
                    </span>
                    {item.lastRestock && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono bg-emerald-950/30 px-1.5 py-0.5 rounded w-fit">
                        <Clock size={10} /> 
                        Reposto: {new Date(item.lastRestock).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`text-2xl font-black ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatValue(remaining, item.unit)}
                  </span>
                  <span className="text-[10px] text-slate-400 block uppercase">Restante</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #fff 5px, #fff 10px)'}}></div>
                <div 
                  className={`h-full transition-all duration-700 ease-out ${
                    isCritical ? 'bg-red-600' : 
                    isLowStock ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Status Footer & Actions */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-600/50">
                <span className="text-xs text-slate-400">
                  Consumido: {formatValue(consumed, item.unit)}
                </span>
                
                {isLowStock ? (
                   <button 
                    onClick={() => handleRestock(item)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg animate-pulse"
                   >
                     <RefreshCw size={14} className="animate-spin-slow" />
                     Confirmar Reposição
                   </button>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-500/50">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-bold uppercase">Estoque OK</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <PackageOpen size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
            <p className="text-slate-400">Monitoramento em tempo real de consumo</p>
          </div>
        </div>
        
        <div className="flex gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Normal
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span> Atenção
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600"></span> Esgotado
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
        {renderCategory('Tamanhos (Embalagens)', 'TAMANHO')}
        {renderCategory('Misturas', 'MISTURA')}
        {renderCategory('Acompanhamentos', 'ACOMPANHAMENTO')}
        {renderCategory('Guarnições', 'GUARNICAO')}
      </div>
    </div>
  );
};