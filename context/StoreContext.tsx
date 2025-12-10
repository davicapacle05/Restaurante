import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, Item, PaymentMethod } from '../types';
import { AVAILABLE_ITEMS } from '../constants';

interface StoreContextType {
  orders: Order[];
  items: Item[];
  registerOrder: (customerName: string, selectedItems: Item[], paymentMethod: PaymentMethod) => Order;
  updateItem: (updatedItem: Item) => void;
  addStock: (itemId: string, quantity: number) => void;
  resetDatabase: () => void;
  resetMenu: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DB_ORDERS_KEY = 'cerejeiras_db_orders';
const DB_ITEMS_KEY = 'cerejeiras_db_items';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(DB_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Items (Menu) State
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem(DB_ITEMS_KEY);
      return saved ? JSON.parse(saved) : AVAILABLE_ITEMS;
    } catch (e) {
      return AVAILABLE_ITEMS;
    }
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem(DB_ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(DB_ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === DB_ORDERS_KEY && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      }
      if (e.key === DB_ITEMS_KEY && e.newValue) {
        setItems(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const registerOrder = (customerName: string, selectedItems: Item[], paymentMethod: PaymentMethod): Order => {
    const newOrder: Order = {
      id: Math.floor(Math.random() * 100000).toString(),
      customerName,
      selectedItems,
      paymentMethod,
      timestamp: Date.now()
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateItem = (updatedItem: Item) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const addStock = (itemId: string, quantity: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, maxStock: i.maxStock + quantity };
      }
      return i;
    }));
  };

  const resetDatabase = () => {
    if(confirm('Limpar todo o histórico de pedidos?')) {
      setOrders([]);
    }
  };

  const resetMenu = () => {
    if(confirm('Restaurar cardápio original? Todas as alterações de estoque e nomes serão perdidas.')) {
      setItems(AVAILABLE_ITEMS);
    }
  }

  return (
    <StoreContext.Provider value={{ orders, items, registerOrder, updateItem, addStock, resetDatabase, resetMenu }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};