import React from 'react';
import { Product } from '../../types';
import { Trash2, ChevronRight } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartSidebarProps {
  cart: CartItem[];
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ cart, onRemove, onCheckout, isOpen, setIsOpen }) => {
  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  if (!isOpen && cart.length === 0) return null;

  return (
    <>
      {/* Mobile Toggle or Floating Button if closed */}
      {!isOpen && cart.length > 0 && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-yellow-400 text-red-900 font-bold p-4 rounded-full shadow-xl flex items-center gap-2 animate-bounce z-50"
        >
          View Order (${total.toFixed(2)})
        </button>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 bg-red-600 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Order</h2>
          <button onClick={() => setIsOpen(false)} className="hover:bg-red-700 p-2 rounded-full">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              Your tray is empty.<br />Add some tasty food!
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                    <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{item.product.name}</p>
                    <p className="text-sm text-gray-500">{item.quantity}x ${item.product.price.toFixed(2)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemove(item.product.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl text-gray-600">Total</span>
            <span className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={onCheckout}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-colors"
          >
            Finish Order
          </button>
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        />
      )}
    </>
  );
};