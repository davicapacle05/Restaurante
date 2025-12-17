export type ItemType = 'TAMANHO' | 'ACOMPANHAMENTO' | 'GUARNICAO' | 'MISTURA' | 'EXTRA' | 'BEBIDA';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  price: number;          // Price in BRL
  portionSize: number;
  unit: string;
  maxStock: number;       // Initial stock for the day
  minStockAlert: number;  // Threshold to trigger replenishment warning
  active: boolean;        // If false, hides from Totem
  lastRestock?: number;   // Timestamp of the last replenishment to reset consumption counter
  hasDelay?: boolean;     // New field: If true, shows a "Production Delay" warning on Totem
  stockName?: string;     // Name of the raw ingredient/stock item (e.g., "Linguiça Crua")
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
  MEAL_VOUCHER = 'MEAL_VOUCHER',
}

export interface Order {
  id: string;
  customerName: string;
  selectedItems: Item[];
  totalValue: number;
  paymentMethod: PaymentMethod;
  timestamp: number;
}