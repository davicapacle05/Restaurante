import React from 'react';
import { Product } from '../../types';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col h-full transform transition-transform hover:scale-105 duration-200">
      <div className="h-48 overflow-hidden relative">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute top-4 right-4 bg-yellow-400 text-red-900 font-bold px-3 py-1 rounded-full shadow-md">
          ${product.price.toFixed(2)}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
          <p className="text-gray-500 text-sm mb-4">Delicious and fresh.</p>
        </div>
        <button 
          onClick={onAdd}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add to Order
        </button>
      </div>
    </div>
  );
};