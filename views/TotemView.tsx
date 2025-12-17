import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Item, ItemType, PaymentMethod, Order } from '../types';
import { Utensils, CheckCircle, ChevronRight, Plus, Minus, ShoppingBag, Trash2, Package, CreditCard, Banknote, QrCode, Wallet, Printer, Lock, CupSoda, X, Clock, AlertTriangle, ChefHat, Beef, Salad, ArrowRight } from 'lucide-react';

// Helper interface for the Cart
interface CartItem {
  id: string; // Unique ID for this cart entry
  type: 'MARMITA' | 'EXTRA';
  title: string;
  items: Item[];
  quantity: number;
}

const PAYMENT_OPTIONS = [
  { id: PaymentMethod.CREDIT_CARD, label: 'Crédito', icon: CreditCard },
  { id: PaymentMethod.DEBIT_CARD, label: 'Débito', icon: CreditCard },
  { id: PaymentMethod.PIX, label: 'PIX', icon: QrCode },
  { id: PaymentMethod.CASH, label: 'Dinheiro', icon: Banknote },
  { id: PaymentMethod.MEAL_VOUCHER, label: 'Vale Ref.', icon: Wallet },
];

// Configuration for limits based on Size ID
// Updated to strict rules: P=2,2,1; M=2,2,2; G=2,2,3
const SIZE_LIMITS: Record<string, Partial<Record<ItemType, number>>> = {
  'tamanho_p': { 'ACOMPANHAMENTO': 2, 'GUARNICAO': 2, 'MISTURA': 1 },
  'tamanho_m': { 'ACOMPANHAMENTO': 2, 'GUARNICAO': 2, 'MISTURA': 2 },
  'tamanho_g': { 'ACOMPANHAMENTO': 2, 'GUARNICAO': 2, 'MISTURA': 3 },
};

export const TotemView: React.FC = () => {
  const { registerOrder, items: availableItems } = useStore();
  
  // State for the CURRENT Marmita being built
  const [currentSelection, setCurrentSelection] = useState<Item[]>([]);
  
  // State for the Cart (Completed Marmitas + Extras)
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // View State
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<'build' | 'checkout' | 'success' | 'receipt'>('build');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Filter only active items for the Totem
  const activeItems = availableItems.filter(i => i.active);

  // Helper to count total items considering quantity
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Helper: Currency Formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Helper: Calculate Cart Total
  const cartTotalValue = cart.reduce((acc, cartItem) => {
    // Sum prices of all items inside the cart item (marmita or extra)
    const itemPrice = cartItem.items.reduce((sum, i) => sum + (i.price || 0), 0);
    return acc + (itemPrice * cartItem.quantity);
  }, 0);

  // --- Logic for Building Current Marmita ---

  const getLimitForType = (type: ItemType): number => {
    const selectedSize = currentSelection.find(i => i.type === 'TAMANHO');
    if (!selectedSize) return 0;
    return SIZE_LIMITS[selectedSize.id]?.[type] || 0;
  };

  const toggleCurrentItem = (item: Item) => {
    setCurrentSelection(prev => {
      // Logic for Size: Single Selection
      if (item.type === 'TAMANHO') {
        const currentSize = prev.find(i => i.type === 'TAMANHO');
        
        // If clicking the exact same size, do nothing
        if (currentSize?.id === item.id) return prev;

        // If changing size, we MUST reset ingredients to ensure new limits are respected
        return [item];
      }

      // Logic for Ingredients: Multiple Selection with Limits
      const selectedSize = prev.find(i => i.type === 'TAMANHO');
      if (!selectedSize) {
        alert("Por favor, selecione o tamanho da marmita primeiro.");
        return prev;
      }

      const exists = prev.find(i => i.id === item.id);
      
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        const currentCount = prev.filter(i => i.type === item.type).length;
        const limit = SIZE_LIMITS[selectedSize.id]?.[item.type] || 0;

        if (currentCount >= limit) {
          // Safety alert if UI allows click
          alert(`Limite de ${limit} opções atingido. Desmarque um item para trocar.`);
          return prev; 
        }

        return [...prev, item];
      }
    });
  };

  const addMarmitaToCart = () => {
    const hasSize = currentSelection.some(i => i.type === 'TAMANHO');
    if (!hasSize) {
      alert("Por favor, escolha o tamanho da marmita.");
      return;
    }
    
    if (currentSelection.length <= 1) {
      alert("Sua marmita está vazia! Escolha alguns ingredientes.");
      return;
    }

    const sizeName = currentSelection.find(i => i.type === 'TAMANHO')?.name || 'Marmita';
    
    const newItem: CartItem = {
      id: Date.now().toString(),
      type: 'MARMITA',
      title: sizeName,
      items: [...currentSelection],
      quantity: 1
    };

    setCart(prev => [...prev, newItem]);
    setCurrentSelection([]); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Logic for Extras (Counter Style) ---

  const getExtraQuantityInCart = (itemId: string) => {
    const found = cart.find(c => c.type === 'EXTRA' && c.items[0].id === itemId);
    return found ? found.quantity : 0;
  };

  const updateExtraQuantity = (item: Item, delta: number) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(c => c.type === 'EXTRA' && c.items[0].id === item.id);
      
      if (existingIndex >= 0) {
        const updatedCart = [...prev];
        const newQty = updatedCart[existingIndex].quantity + delta;
        
        if (newQty <= 0) {
          updatedCart.splice(existingIndex, 1);
        } else {
          updatedCart[existingIndex] = { ...updatedCart[existingIndex], quantity: newQty };
        }
        return updatedCart;
      } else if (delta > 0) {
        const newItem: CartItem = {
          id: `extra-${item.id}`,
          type: 'EXTRA',
          title: item.name,
          items: [item],
          quantity: 1
        };
        return [...prev, newItem];
      }
      
      return prev;
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(i => i.id !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity < 1) return item; 
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // --- Logic for Finishing Order ---

  const handleFinishOrder = () => {
    if (!paymentMethod) return;

    const allItems = cart.flatMap(cartItem => {
      return Array(cartItem.quantity).fill(cartItem.items).flat();
    });
    
    const order = registerOrder(customerName || 'Cliente Balcão', allItems, paymentMethod);
    setLastOrder(order);
    setStep('success');
    
    setTimeout(() => {
      setStep('receipt');
    }, 2000);
  };

  const handleCloseReceipt = () => {
    setStep('build');
    setCart([]);
    setCurrentSelection([]);
    setCustomerName('');
    setPaymentMethod(null);
    setLastOrder(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Render Helpers ---

  const renderBuilderSection = (title: string, type: ItemType, stepIndex: number, icon?: React.ReactNode) => {
    const selectedSize = currentSelection.find(i => i.type === 'TAMANHO');
    const isSizeSection = type === 'TAMANHO';
    
    const isDisabledSection = !isSizeSection && !selectedSize;
    
    const currentCount = currentSelection.filter(i => i.type === type).length;
    const limit = isSizeSection ? 1 : (selectedSize ? (SIZE_LIMITS[selectedSize.id]?.[type] || 0) : 0);
    const isLimitReached = !isSizeSection && currentCount >= limit;
    const isFullySelected = !isSizeSection && currentCount === limit;

    return (
      <section className={`mb-12 transition-all duration-500 ${isDisabledSection ? 'opacity-50 grayscale-[0.5] pointer-events-none' : 'opacity-100'}`}>
        
        {/* Header */}
        <div className="flex items-end justify-between mb-5 px-1">
           <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-sm transition-colors ${
                  isDisabledSection ? 'bg-gray-200 text-gray-400' : 
                  isFullySelected ? 'bg-green-500 text-white' : 'bg-red-600 text-white'
              }`}>
                 {stepIndex}
              </div>
              <div>
                 <h2 className="text-2xl font-black text-gray-800 leading-tight flex items-center gap-2">
                    {title}
                    {icon && <span className="text-gray-400">{icon}</span>}
                 </h2>
                 {!isDisabledSection && !isSizeSection && (
                    <p className="text-sm text-gray-500 font-medium mt-1">
                       Selecione até <span className="text-red-600 font-bold">{limit}</span> opções
                    </p>
                 )}
                 {isSizeSection && (
                    <p className="text-sm text-gray-400 font-medium mt-1">O tamanho define a quantidade de misturas</p>
                 )}
              </div>
           </div>
           
           {!isSizeSection && !isDisabledSection && (
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                  isFullySelected ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 shadow-sm'
              }`}>
                 {isFullySelected && <CheckCircle size={14} />}
                 {currentCount} / {limit} Selecionados
              </div>
           )}
        </div>
        
        {/* Messages */}
        {isDisabledSection && (
          <div className="bg-gray-100/50 rounded-xl p-8 text-center text-gray-400 flex flex-col items-center gap-3 border-2 border-dashed border-gray-200">
            <Lock size={32} className="opacity-50" />
            <p className="font-medium">Selecione o tamanho da marmita para liberar esta etapa.</p>
          </div>
        )}

        {isLimitReached && !isSizeSection && !isDisabledSection && (
           <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 text-orange-800 p-3 rounded-r-lg shadow-sm text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <AlertTriangle size={18} />
              <p>Limite atingido! Desmarque um item para trocar.</p>
           </div>
        )}

        {/* Grid */}
        <div className={`grid grid-cols-1 ${type === 'TAMANHO' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 ${isDisabledSection ? 'hidden' : ''}`}>
          {activeItems.filter(i => i.type === type).map(item => {
            const isSelected = currentSelection.some(i => i.id === item.id);
            const isOutOfStock = item.maxStock > 0 && item.maxStock <= 0; 
            const disabled = isOutOfStock || (isLimitReached && !isSelected);

            return (
              <button 
                key={item.id}
                onClick={() => toggleItemSelection(item)}
                disabled={disabled}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between group overflow-hidden ${
                  isSelected 
                    ? 'bg-red-50 border-red-500 shadow-md transform scale-[1.02]' 
                    : disabled
                      ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-sm'
                }`}
              >
                <div className="z-10 w-full pr-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-bold text-lg leading-tight ${isSelected ? 'text-red-900' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                  </div>

                  {item.price > 0 ? (
                      <span className={`text-xs font-bold px-2 py-1 rounded inline-block ${isSelected ? 'bg-white text-red-800 border border-red-100' : 'bg-gray-100 text-gray-600'}`}>
                        + {formatCurrency(item.price)}
                      </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">Incluso</span>
                  )}
                  
                  {item.type === 'TAMANHO' && (
                    <span className="text-xs text-gray-400 block mt-2 font-medium">Embalagem Térmica</span>
                  )}

                  <div className="mt-2 space-y-1">
                    {isOutOfStock && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded uppercase">
                         Esgotado
                      </span>
                    )}
                    
                    {item.hasDelay && !isOutOfStock && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-700 w-full md:w-auto">
                         <Clock size={12} className="shrink-0" />
                         <span className="text-[10px] font-bold uppercase leading-tight">Demora no preparo</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                  isSelected 
                    ? 'bg-red-500 border-red-500 scale-110' 
                    : 'border-gray-200 bg-gray-50 text-gray-300 group-hover:border-red-300'
                }`}>
                  {isSelected ? <CheckCircle size={18} className="text-white" /> : <Plus size={18} />}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  const toggleItemSelection = (item: Item) => {
     toggleCurrentItem(item);
  };

  // --- Helper for rendering grid of Extras/Drinks ---
  const renderCounterGrid = (items: Item[]) => (
    <div className="grid grid-cols-1 gap-4">
      {items.map(item => {
        const qtyInCart = getExtraQuantityInCart(item.id);
        const isOutOfStock = item.maxStock > 0 && item.maxStock <= 0;

        return (
          <div 
            key={item.id}
            className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center group transition-colors ${isOutOfStock ? 'opacity-60 bg-gray-50' : 'hover:border-gray-300 hover:shadow-md'}`}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
               <div className={`shrink-0 p-3 rounded-xl ${item.type === 'BEBIDA' ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                  {item.type === 'BEBIDA' ? <CupSoda size={24} /> :
                   item.name.toLowerCase().includes('talher') ? <Utensils size={24} /> : 
                   <Package size={24} />}
               </div>
               <div className="min-w-0">
                 <span className="font-bold text-gray-800 leading-tight block text-lg">{item.name}</span>
                 {item.price > 0 && <span className="text-sm font-bold text-green-600 block mt-0.5">{formatCurrency(item.price)}</span>}
                 
                 {isOutOfStock && <span className="text-[10px] text-red-500 font-bold uppercase block mt-1">Esgotado</span>}
                 {item.hasDelay && !isOutOfStock && <span className="text-[10px] text-amber-500 font-bold uppercase block mt-1 flex items-center gap-1"><Clock size={10} /> Demora</span>}
               </div>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1.5 border border-gray-100 shadow-inner shrink-0">
              <button 
                onClick={() => updateExtraQuantity(item, -1)}
                disabled={qtyInCart === 0}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:shadow-none disabled:bg-transparent transition-all"
              >
                <Minus size={18} />
              </button>
              <span className={`w-8 text-center font-bold text-lg ${qtyInCart > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                {qtyInCart}
              </span>
              <button 
                onClick={() => updateExtraQuantity(item, 1)}
                disabled={isOutOfStock}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:shadow-none disabled:bg-transparent transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- Views ---

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[60] bg-green-500 flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in">
        <div className="bg-white text-green-500 p-8 rounded-full mb-6 shadow-2xl animate-bounce">
          <CheckCircle size={80} strokeWidth={3} />
        </div>
        <h1 className="text-5xl font-bold mb-4">Pagamento Confirmado!</h1>
        <p className="text-xl opacity-90 max-w-md">Gerando seu comprovante...</p>
      </div>
    );
  }

  if (step === 'receipt' && lastOrder) {
    return (
      <div className="fixed inset-0 z-[60] bg-gray-100 flex flex-col items-center justify-center p-4">
        
        {/* Print Styles */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              #receipt-container, #receipt-container * {
                visibility: visible;
              }
              #receipt-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm; /* Standard thermal printer width */
                margin: 0;
                padding: 0;
                background: white;
                box-shadow: none;
                border: none;
              }
              #no-print {
                display: none !important;
              }
            }
          `}
        </style>

        <div id="receipt-container" className="bg-white p-6 rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl w-full max-w-[350px] text-gray-800 font-mono text-sm border border-gray-200">
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-xl font-black uppercase mb-1">Cerejeiras</h2>
            <p className="text-xs text-gray-500">Comida Caseira & Marmitex</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(lastOrder.timestamp).toLocaleString()}</p>
            <p className="text-xs text-gray-400">Pedido #{lastOrder.id}</p>
          </div>

          <div className="space-y-4 border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            {cart.map((cartItem, idx) => {
               const itemTotal = cartItem.items.reduce((s, i) => s + (i.price || 0), 0) * cartItem.quantity;
               return (
                <div key={idx} className="mb-2">
                  <div className="font-bold uppercase flex justify-between">
                    <span>
                      {cartItem.quantity > 1 ? `${cartItem.quantity}x ` : ''} 
                      {cartItem.type === 'MARMITA' ? `${idx + 1}. Marmita` : 'Extra'}
                    </span>
                    <span>{formatCurrency(itemTotal)}</span>
                  </div>
                  {cartItem.type === 'MARMITA' && <span className="text-xs font-normal block mb-1">{cartItem.title}</span>}
                  
                  <ul className="pl-2 space-y-0.5">
                    {cartItem.items.filter(i => i.type !== 'TAMANHO').map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex justify-between">
                        <span className="flex items-center gap-1">
                          - {item.name}
                          {item.hasDelay && <Clock size={10} className="text-amber-500" />}
                        </span>
                        {item.price > 0 && <span>{formatCurrency(item.price)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
               );
            })}
          </div>

          <div className="text-right space-y-1 mb-6">
             <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(lastOrder.totalValue || cartTotalValue)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Pagamento:</span>
              <span>{PAYMENT_OPTIONS.find(p => p.id === lastOrder.paymentMethod)?.label}</span>
            </div>
             <div className="flex justify-between text-xs text-gray-500">
              <span>Cliente:</span>
              <span>{lastOrder.customerName}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400">
            <p>Obrigado pela preferência!</p>
            <p>www.restaurantecerejeiras.com.br</p>
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div id="no-print" className="mt-8 flex flex-col gap-3 w-full max-w-[350px]">
          <button 
            onClick={handlePrint}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-700 flex items-center justify-center gap-2"
          >
            <Printer size={20} />
            Imprimir Notinha
          </button>
          
          <button 
            onClick={handleCloseReceipt}
            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Novo Pedido
          </button>
        </div>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="fixed inset-0 z-[60] bg-rose-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh] relative">
          
          {/* Fixed Header */}
          <div className="p-5 bg-red-600 text-white flex justify-between items-center shrink-0 shadow-md z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="text-red-200" /> Resumo do Pedido
            </h2>
            <button onClick={() => setStep('build')} className="text-white/80 hover:text-white bg-red-700/50 hover:bg-red-700 p-2 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>
          
          {/* Scrollable Content - Light Cherry Pink Background */}
          <div className="flex-grow overflow-y-auto p-5 space-y-6 bg-rose-50">
            
            {/* Empty State */}
            {cart.length === 0 && (
              <p className="text-center text-gray-500 py-10">Seu carrinho está vazio.</p>
            )}

            {/* Items List */}
            <div className="space-y-3">
              {cart.map((cartItem) => {
                const singleUnitTotal = cartItem.items.reduce((acc, i) => acc + (i.price || 0), 0);
                const lineTotal = singleUnitTotal * cartItem.quantity;

                return (
                  <div key={cartItem.id} className="bg-white border border-rose-100 p-4 rounded-2xl relative shadow-sm">
                    <button 
                      onClick={() => removeFromCart(cartItem.id)}
                      className="absolute top-3 right-3 text-rose-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="flex justify-between items-start pr-8 mb-2">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                        {cartItem.type === 'MARMITA' ? <Utensils size={16} className="text-gray-400" /> : <Package size={16} className="text-gray-400" />}
                        {cartItem.title}
                      </h3>
                      <span className="font-bold text-gray-800">{formatCurrency(lineTotal)}</span>
                    </div>
                    
                    {cartItem.type === 'MARMITA' && (
                      <ul className="text-sm text-gray-600 space-y-1 pl-4 border-l-2 border-gray-100 mb-4">
                        {cartItem.items.filter(i => i.type !== 'TAMANHO').map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              {item.name}
                              {item.hasDelay && (
                                 <div className="group relative flex items-center cursor-help">
                                    <Clock size={14} className="text-amber-500" />
                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded border border-amber-200 shadow-sm whitespace-nowrap z-50">
                                      Demora na preparação
                                    </span>
                                 </div>
                              )}
                            </span>
                            {item.price > 0 && <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{formatCurrency(item.price)}</span>}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center justify-between pt-2">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quantidade</span>
                       <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button 
                          onClick={() => updateQuantity(cartItem.id, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm disabled:opacity-50 border border-gray-100"
                          disabled={cartItem.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-bold text-gray-800">{cartItem.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(cartItem.id, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm border border-gray-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Block */}
            <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm flex justify-between items-center">
               <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total a Pagar</span>
               <span className="text-3xl font-black text-gray-800 tracking-tight">{formatCurrency(cartTotalValue)}</span>
            </div>

            {/* Order Details Form */}
            <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-sm space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nome do Cliente (Opcional)</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 bg-white text-gray-800 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
                  placeholder="Ex: João"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setPaymentMethod(option.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${
                        paymentMethod === option.id 
                          ? 'border-red-500 bg-red-50 text-red-700 shadow-sm ring-1 ring-red-500' 
                          : 'border-gray-100 bg-white text-gray-400 hover:bg-rose-50 hover:border-rose-200'
                      }`}
                    >
                      <option.icon size={20} />
                      <span className="text-[10px] font-bold text-center uppercase">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="p-4 bg-white border-t border-rose-100 shrink-0 flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
             <button 
                onClick={() => setStep('build')}
                className="px-6 py-4 rounded-xl font-bold text-rose-700 hover:bg-rose-50 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handleFinishOrder}
                disabled={cart.length === 0 || !paymentMethod}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all transform active:scale-95 flex flex-col items-center justify-center"
              >
                <span className="leading-none">Pagar {formatCurrency(cartTotalValue)}</span>
                {!paymentMethod && <span className="text-[10px] font-normal opacity-80 mt-1">Selecione o pagamento</span>}
              </button>
          </div>

        </div>
      </div>
    );
  }

  // --- Build Screen ---

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md p-4 shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="container mx-auto md:max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
              <span className="text-red-600">Restaurante</span> Cerejeiras
            </h1>
          </div>
          
          {/* Cart Preview (Small) */}
          {cart.length > 0 && (
             <button 
              onClick={() => setStep('checkout')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-all cursor-pointer"
            >
              <ShoppingBag size={18} />
              <span className="font-bold text-sm">{totalCartItems} no carrinho</span>
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 md:max-w-4xl">
        
        {/* Intro Banner */}
        <div className="mb-10 text-center py-6">
           <h2 className="text-3xl font-black text-gray-800 mb-2">Monte sua Marmita</h2>
           <p className="text-gray-500">Siga os passos abaixo para preparar seu pedido do seu jeito.</p>
        </div>

        {/* Status Message */}
        {cart.length > 0 && currentSelection.length === 0 && (
          <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm">
            <div className="bg-white p-2 rounded-full shadow-sm text-green-600">
               <CheckCircle size={24} />
            </div>
            <div>
              <span className="font-bold text-lg">Marmita adicionada ao carrinho!</span>
              <p className="text-sm opacity-90">Você pode montar outra abaixo ou finalizar o pedido.</p>
            </div>
          </div>
        )}

        {/* Builder Sections */}
        {renderBuilderSection('Escolha o Tamanho', 'TAMANHO', 1, <Package size={20} />)}
        {renderBuilderSection('Proteína (Mistura)', 'MISTURA', 2, <Beef size={20} />)}
        {renderBuilderSection('Acompanhamentos', 'ACOMPANHAMENTO', 3, <Utensils size={20} />)}
        {renderBuilderSection('Guarnições', 'GUARNICAO', 4, <Salad size={20} />)}

        {/* Add Marmita Button - Main CTA */}
        <div className="mb-16 flex flex-col items-center">
          <button 
            onClick={addMarmitaToCart}
            disabled={currentSelection.length <= 1}
            className="w-full md:w-auto min-w-[300px] bg-gray-900 hover:bg-black text-white font-bold text-xl py-5 px-10 rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Plus size={28} className="text-yellow-400" />
            Adicionar Marmita
          </button>
          <p className="text-gray-400 text-sm font-medium mt-3">Finalize a montagem para adicionar ao pedido</p>
        </div>

        {/* Marketplace Divider */}
        <div className="flex items-center gap-4 mb-10">
           <div className="h-px bg-gray-300 flex-grow"></div>
           <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Bebidas e Extras</span>
           <div className="h-px bg-gray-300 flex-grow"></div>
        </div>

        {/* Drinks & Extras Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Drinks */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                 <CupSoda size={20} />
              </div>
              Bebidas Geladas
            </h2>
            {renderCounterGrid(activeItems.filter(i => i.type === 'BEBIDA'))}
          </div>

          {/* Other Extras */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                 <Package size={20} />
              </div>
              Extras & Descartáveis
            </h2>
            {renderCounterGrid(activeItems.filter(i => i.type === 'EXTRA'))}
          </div>

        </div>
      </main>

      {/* Floating Checkout Footer - Enhanced */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-center pb-8">
          <div className="bg-rose-950 text-white p-3 pr-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl bg-opacity-95 pointer-events-auto w-full max-w-md animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-red-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-inner border-2 border-rose-800">
              {totalCartItems}
            </div>
            
            <div className="flex-grow">
               <p className="text-red-200 text-xs font-bold uppercase tracking-wider mb-0.5">Total do Pedido</p>
               <p className="text-2xl font-black leading-none">{formatCurrency(cartTotalValue)}</p>
            </div>

            <button 
              onClick={() => setStep('checkout')}
              className="bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all transform active:scale-95 group"
            >
              <span>Ver Carrinho</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};