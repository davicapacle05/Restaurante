import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ItemType, Item } from '../types';
import { PackageOpen, CheckCircle2, RefreshCw } from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, items: availableItems, updateItem } = useStore();

  // Calculate consumed stock based on orders relative to the last restock time
  const stockStatus = useMemo(() => {
    const consumption: Record<string, number> = {};
    
    // Initialize
    availableItems.forEach(item => {
      consumption[item.id] = 0;
    });

    // Calculate total consumption (Count * PortionSize)
    // ONLY count orders that occurred AFTER the item's last restock timestamp
    orders.forEach(order => {
      order.selectedItems.forEach(item => {
        const currentItem = availableItems.find(i => i.id === item.id);
        
        if (currentItem && consumption[item.id] !== undefined) {
          // If lastRestock is undefined (never stocked), it treats timestamp 0 as start (counts all)
          // If lastRestock exists, only orders newer than that are counted
          if (order.timestamp > (currentItem.lastRestock || 0)) {
            consumption[item.id] += item.portionSize;
          }
        }
      });
    });

    return consumption;
  }, [orders, availableItems]);

  const handleRestock = (item: Item) => {
    // Instead of increasing maxStock, we reset the "Start Time" for consumption tracking.
    // This effectively zeroes out the consumption counter for this item.
    if (confirm(`Confirmar reposição de ${item.name}? O estoque voltará para ${formatValue(item.maxStock, item.unit)} (100%).`)) {
      updateItem({ ...item, lastRestock: Date.now() });
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
          // maxStock now represents the "Bin Capacity", not accumulated total.
          const batchSize = item.maxStock; 

          const consumed = stockStatus[item.id] || 0;
          const remaining = Math.max(0, batchSize - consumed);
          
          const percentage = Math.min(100, Math.max(0, (remaining / batchSize) * 100));
          
          const isLowStock = remaining <= item.minStockAlert;
          const isCritical = remaining === 0;

          return (
            <div key={item.id} className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${isLowStock ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-700/30 border-slate-600'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-100 font-bold block text-lg">{item.name}</span>
                  <span className="text-xs text-slate-400">
                    Capacidade: {formatValue(batchSize, item.unit)}
                  </span>
                </div>
                
                <div className="text-right">
                  <span className={`text-2xl font-black ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatValue(remaining, item.unit)}
                  </span>
                  <span className="text-[10px] text-slate-400 block uppercase">Restante</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isCritical ? 'bg-red-600' : 
                    isLowStock ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Status Footer & Actions */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-600/50">
                <span className="text-xs text-slate-400">
                  Consumido (Atual): {formatValue(consumed, item.unit)}
                </span>
                
                {isLowStock ? (
                   <button 
                    onClick={() => handleRestock(item)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg animate-pulse"
                   >
                     <RefreshCw size={14} />
                     Confirmar Reposição
                   </button>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-500/50">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-bold uppercase">OK</span>
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