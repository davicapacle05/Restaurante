import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Item, ItemType, PaymentMethod, Order } from '../types';
import { Utensils, CheckCircle, ChevronRight, Scale, Plus, Minus, ShoppingBag, Trash2, Package, CreditCard, Banknote, QrCode, Wallet, Printer, Home } from 'lucide-react';

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
  { id: PaymentMethod.MEAL_VOUCHER, label: 'Vale Refeição', icon: Wallet },
];

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

  // --- Logic for Building Current Marmita ---

  const toggleCurrentItem = (item: Item) => {
    setCurrentSelection(prev => {
      // Logic for Size: Single Selection
      if (item.type === 'TAMANHO') {
        const others = prev.filter(i => i.type !== 'TAMANHO');
        // If clicking the same, don't remove, just keep it (radio behavior)
        return [...others, item];
      }

      // Logic for Ingredients: Multiple Selection
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, item];
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
    setCurrentSelection([]); // Reset builder
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addExtraToCart = (item: Item) => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      type: 'EXTRA',
      title: item.name,
      items: [item],
      quantity: 1
    };
    setCart(prev => [...prev, newItem]);
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(i => i.id !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity < 1) return item; // Prevent going below 1
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // --- Logic for Finishing Order ---

  const handleFinishOrder = () => {
    if (!paymentMethod) return;

    // Flatten all items from cart into a single list for the backend, respecting quantity
    const allItems = cart.flatMap(cartItem => {
      // Repeat the items array 'quantity' times
      return Array(cartItem.quantity).fill(cartItem.items).flat();
    });
    
    const order = registerOrder(customerName || 'Cliente Balcão', allItems, paymentMethod);
    setLastOrder(order);
    
    // Move to success -> then receipt
    setStep('success');
    
    // Simulate processing delay then show receipt
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

  const renderBuilderSection = (title: string, type: ItemType) => (
    <div className="mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-yellow-400 pl-3">{title}</h2>
      <div className={`grid grid-cols-1 ${type === 'TAMANHO' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
        {activeItems.filter(i => i.type === type).map(item => {
          const isSelected = currentSelection.find(i => i.id === item.id);
          const isOutOfStock = item.maxStock > 0 && item.maxStock <= 0; // Simplified logic, real app would check available stock context

          return (
            <button 
              key={item.id}
              onClick={() => toggleItemSelection(item)}
              disabled={isOutOfStock}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group relative overflow-hidden ${
                isSelected 
                  ? 'bg-red-50 border-red-500 shadow-md' 
                  : 'bg-slate-50 border-slate-200 hover:border-red-300'
              }`}
            >
              <div className="z-10">
                <span className={`font-bold block ${isSelected ? 'text-red-700' : 'text-slate-600'} ${type === 'TAMANHO' ? 'text-lg' : ''}`}>
                  {item.name}
                </span>
                {item.type === 'TAMANHO' && (
                  <span className="text-xs text-slate-400">Embalagem Individual</span>
                )}
              </div>
              
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors z-10 ${
                isSelected ? 'bg-red-500 border-red-500' : 'border-slate-300 group-hover:border-red-300'
              }`}>
                {isSelected && <CheckCircle size={14} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const toggleItemSelection = (item: Item) => {
     toggleCurrentItem(item);
  };

  // --- Views ---

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in">
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
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        
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

        <div id="receipt-container" className="bg-white p-6 rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl w-full max-w-[350px] text-slate-800 font-mono text-sm border border-slate-200">
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
            <h2 className="text-xl font-black uppercase mb-1">Cerejeiras</h2>
            <p className="text-xs text-slate-500">Comida Caseira & Marmitex</p>
            <p className="text-xs text-slate-400 mt-2">{new Date(lastOrder.timestamp).toLocaleString()}</p>
            <p className="text-xs text-slate-400">Pedido #{lastOrder.id}</p>
          </div>

          <div className="space-y-4 border-b-2 border-dashed border-slate-300 pb-4 mb-4">
            {cart.map((cartItem, idx) => (
              <div key={idx} className="mb-2">
                <p className="font-bold uppercase flex justify-between">
                  <span>
                    {cartItem.quantity > 1 ? `${cartItem.quantity}x ` : ''} 
                    {cartItem.type === 'MARMITA' ? `${idx + 1}. Marmita` : 'Extra'}
                  </span>
                  {cartItem.type === 'MARMITA' && <span className="text-xs font-normal">{cartItem.title}</span>}
                </p>
                <ul className="pl-2 mt-1 space-y-0.5">
                  {cartItem.items.filter(i => i.type !== 'TAMANHO').map((item, i) => (
                    <li key={i} className="text-xs text-slate-600 flex justify-between">
                      <span>- {item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-right space-y-1 mb-6">
             <div className="flex justify-between font-bold text-lg">
              <span>Total Itens:</span>
              <span>{totalCartItems}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Pagamento:</span>
              <span>{PAYMENT_OPTIONS.find(p => p.id === lastOrder.paymentMethod)?.label}</span>
            </div>
             <div className="flex justify-between text-xs text-slate-500">
              <span>Cliente:</span>
              <span>{lastOrder.customerName}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 bg-red-600 text-white flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag /> Resumo do Pedido
            </h2>
            <button onClick={() => setStep('build')} className="text-white/80 hover:text-white font-bold text-sm">
              Adicionar Mais
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500">Seu carrinho está vazio.</p>
            ) : (
              cart.map((cartItem) => (
                <div key={cartItem.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative">
                  <button 
                    onClick={() => removeFromCart(cartItem.id)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>

                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                    {cartItem.type === 'MARMITA' ? <Utensils size={16} /> : <Package size={16} />}
                    {cartItem.title}
                  </h3>
                  
                  {cartItem.type === 'MARMITA' && (
                    <ul className="text-sm text-slate-600 space-y-1 pl-6 border-l-2 border-slate-200">
                      {cartItem.items.filter(i => i.type !== 'TAMANHO').map((item, idx) => (
                         <li key={idx}>{item.name}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">Quantidade</span>
                    <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                      <button 
                        onClick={() => updateQuantity(cartItem.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={cartItem.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-800">{cartItem.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(cartItem.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-slate-100 border-t border-slate-200 overflow-y-auto">
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome para Entrega (Opcional)</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3 bg-white text-black rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${
                      paymentMethod === option.id 
                        ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-500 hover:border-red-200'
                    }`}
                  >
                    <option.icon size={20} />
                    <span className="text-xs font-bold text-center">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep('build')}
                className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handleFinishOrder}
                disabled={cart.length === 0 || !paymentMethod}
                className="flex-[2] py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex flex-col items-center justify-center leading-tight"
              >
                <span>Confirmar Pedido</span>
                {!paymentMethod && <span className="text-[10px] font-normal opacity-80">Selecione o pagamento</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Build Screen ---

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-white p-6 shadow-sm sticky top-0 z-20 border-b border-slate-200">
        <div className="container mx-auto md:max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span className="text-red-600">Restaurante</span> Cerejeiras
            </h1>
            <p className="text-slate-500 text-sm">Monte sua marmita do seu jeito</p>
          </div>
          
          {/* Cart Preview (Small) */}
          <button 
            onClick={() => cart.length > 0 && setStep('checkout')}
            className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all ${cart.length > 0 ? 'bg-red-100 text-red-700 cursor-pointer' : 'bg-slate-100 text-slate-400'}`}
          >
            <ShoppingBag size={20} />
            <span className="font-bold">{totalCartItems}</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto p-6 md:max-w-4xl">
        
        {/* Status Message */}
        {cart.length > 0 && currentSelection.length === 0 && (
          <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-4">
            <CheckCircle size={20} />
            <div>
              <span className="font-bold">Marmita adicionada ao carrinho!</span>
              <p className="text-sm">Você pode montar outra abaixo ou finalizar o pedido.</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold text-sm uppercase tracking-wider">
          <div className="h-px bg-slate-300 flex-grow"></div>
          Nova Marmita
          <div className="h-px bg-slate-300 flex-grow"></div>
        </div>

        {renderBuilderSection('1. Escolha o Tamanho', 'TAMANHO')}
        {renderBuilderSection('2. Proteína (Mistura)', 'MISTURA')}
        {renderBuilderSection('3. Acompanhamentos', 'ACOMPANHAMENTO')}
        {renderBuilderSection('4. Guarnições', 'GUARNICAO')}

        {/* Add Marmita Button */}
        <div className="mb-12">
          <button 
            onClick={addMarmitaToCart}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <Plus size={24} className="text-yellow-400" />
            Adicionar Marmita ao Carrinho
          </button>
        </div>

        {/* Extras Section */}
        <div className="mt-12 pt-8 border-t-2 border-slate-200 border-dashed">
          <h2 className="text-xl font-bold text-slate-600 mb-4 flex items-center gap-2">
            <Package /> Itens Extras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeItems.filter(i => i.type === 'EXTRA').map(item => (
              <button 
                key={item.id}
                onClick={() => addExtraToCart(item)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-red-300 group"
              >
                <span className="font-medium text-slate-700">{item.name}</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                  + Adicionar
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Checkout Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-30">
          <div className="container mx-auto md:max-w-4xl flex items-center justify-between gap-4">
            <div className="hidden md:block">
              <p className="text-slate-500 text-sm">Total de itens</p>
              <p className="text-2xl font-black text-slate-800">{totalCartItems}</p>
            </div>
            <button 
              onClick={() => setStep('checkout')}
              className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              Finalizar Pedido <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};