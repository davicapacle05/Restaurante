import React, { useState } from 'react';
import { PaymentMethod } from '../../types';
import { CreditCard, Banknote, QrCode, Wallet, X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, method: PaymentMethod) => void;
  total: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, total }) => {
  const [name, setName] = useState('');
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!method) return;
    onConfirm(name || 'Guest', method);
  };

  const methods = [
    { id: PaymentMethod.CREDIT_CARD, label: 'Credit Card', icon: <CreditCard size={32} /> },
    { id: PaymentMethod.DEBIT_CARD, label: 'Debit Card', icon: <CreditCard size={32} /> },
    { id: PaymentMethod.PIX, label: 'Pix', icon: <QrCode size={32} /> },
    { id: PaymentMethod.CASH, label: 'Cash', icon: <Banknote size={32} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <div className="p-6 bg-red-600 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button onClick={onClose} className="p-2 hover:bg-red-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-500 mb-1">Total to Pay</p>
            <p className="text-5xl font-black text-gray-800">${total.toFixed(2)}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name (Optional)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-red-500 transition-all text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                      method === m.id 
                        ? 'border-red-500 bg-red-50 text-red-600 shadow-md transform scale-105' 
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {m.icon}
                    <span className="font-bold text-sm">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!method}
            className="w-full mt-8 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-colors"
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};