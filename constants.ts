import { Item } from './types';

export const AVAILABLE_ITEMS: Item[] = [
  // Tamanhos (Base Price lives here)
  { id: 'tamanho_p', name: 'Marmita P', stockName: 'Embalagem P (Isopor)', type: 'TAMANHO', price: 18.00, portionSize: 1, unit: 'un', maxStock: 50, minStockAlert: 10, active: true, hasDelay: false },
  { id: 'tamanho_m', name: 'Marmita M', stockName: 'Embalagem M (Isopor)', type: 'TAMANHO', price: 22.00, portionSize: 1, unit: 'un', maxStock: 50, minStockAlert: 10, active: true, hasDelay: false },
  { id: 'tamanho_g', name: 'Marmita G', stockName: 'Embalagem G (Isopor)', type: 'TAMANHO', price: 26.00, portionSize: 1, unit: 'un', maxStock: 50, minStockAlert: 10, active: true, hasDelay: false },

  // Acompanhamentos (Included in price)
  { id: 'arroz_branco', name: 'Arroz Branco', stockName: 'Arroz Branco (Cozido)', type: 'ACOMPANHAMENTO', price: 0, portionSize: 200, unit: 'g', maxStock: 5000, minStockAlert: 1000, active: true, hasDelay: false },
  { id: 'feijao_carioca', name: 'Feijão Carioca', stockName: 'Feijão Carioca (Caldo)', type: 'ACOMPANHAMENTO', price: 0, portionSize: 200, unit: 'g', maxStock: 4000, minStockAlert: 800, active: true, hasDelay: false },
  { id: 'feijao_preto', name: 'Feijão Preto', stockName: 'Feijão Preto (Caldo)', type: 'ACOMPANHAMENTO', price: 0, portionSize: 200, unit: 'g', maxStock: 3000, minStockAlert: 600, active: true, hasDelay: false },
  { id: 'arroz_integral', name: 'Arroz Integral', stockName: 'Arroz Integral (Cozido)', type: 'ACOMPANHAMENTO', price: 0, portionSize: 200, unit: 'g', maxStock: 2000, minStockAlert: 500, active: true, hasDelay: false },

  // Guarnições (Included in price)
  { id: 'farofa', name: 'Farofa da Casa', stockName: 'Farinha/Farofa Pronta', type: 'GUARNICAO', price: 0, portionSize: 80, unit: 'g', maxStock: 1000, minStockAlert: 200, active: true, hasDelay: false },
  { id: 'fritas', name: 'Batata Frita', stockName: 'Batata Congelada (Saco)', type: 'GUARNICAO', price: 0, portionSize: 120, unit: 'g', maxStock: 2000, minStockAlert: 500, active: true, hasDelay: false },
  { id: 'salada', name: 'Salada Mix', stockName: 'Hortifruti (Mix Folhas)', type: 'GUARNICAO', price: 0, portionSize: 1, unit: 'porção', maxStock: 30, minStockAlert: 5, active: true, hasDelay: false },
  { id: 'legumes', name: 'Legumes Vapor', stockName: 'Legumes (Cenoura/Vagem)', type: 'GUARNICAO', price: 0, portionSize: 100, unit: 'g', maxStock: 2000, minStockAlert: 400, active: true, hasDelay: false },

  // Misturas (Included in price)
  { id: 'bife_acebolado', name: 'Bife Acebolado', stockName: 'Carne (Contra-filé Cru)', type: 'MISTURA', price: 0, portionSize: 1, unit: 'un', maxStock: 40, minStockAlert: 5, active: true, hasDelay: false },
  { id: 'frango_grelhado', name: 'Filé de Frango', stockName: 'Peito de Frango (Cru)', type: 'MISTURA', price: 0, portionSize: 1, unit: 'un', maxStock: 40, minStockAlert: 5, active: true, hasDelay: false },
  { id: 'linguica', name: 'Linguiça Toscana', stockName: 'Linguiça Toscana (Crua)', type: 'MISTURA', price: 0, portionSize: 1, unit: 'un', maxStock: 50, minStockAlert: 10, active: true, hasDelay: false },
  { id: 'omelete', name: 'Omelete', stockName: 'Ovos (Cartela)', type: 'MISTURA', price: 0, portionSize: 1, unit: 'un', maxStock: 30, minStockAlert: 5, active: true, hasDelay: false },

  // Bebidas (Paid)
  { id: 'coca_lata', name: 'Coca-Cola Lata 350ml', type: 'BEBIDA', price: 6.00, portionSize: 1, unit: 'un', maxStock: 48, minStockAlert: 12, active: true, hasDelay: false },
  { id: 'guarana_lata', name: 'Guaraná Lata 350ml', type: 'BEBIDA', price: 6.00, portionSize: 1, unit: 'un', maxStock: 48, minStockAlert: 12, active: true, hasDelay: false },
  { id: 'agua_sem_gas', name: 'Água s/ Gás 500ml', type: 'BEBIDA', price: 4.00, portionSize: 1, unit: 'un', maxStock: 60, minStockAlert: 12, active: true, hasDelay: false },
  { id: 'suco_laranja', name: 'Suco de Laranja 500ml', type: 'BEBIDA', price: 8.00, portionSize: 1, unit: 'un', maxStock: 20, minStockAlert: 5, active: true, hasDelay: true },

  // Extras (Paid)
  { id: 'embalagem_extra', name: 'Embalagem Extra (Separada)', type: 'EXTRA', price: 1.50, portionSize: 1, unit: 'un', maxStock: 100, minStockAlert: 20, active: true, hasDelay: false },
  { id: 'talheres', name: 'Talheres Descartáveis', type: 'EXTRA', price: 0.50, portionSize: 1, unit: 'kit', maxStock: 1000, minStockAlert: 100, active: true, hasDelay: false },
  { id: 'copo', name: 'Copo Descartável', type: 'EXTRA', price: 0.25, portionSize: 1, unit: 'un', maxStock: 1000, minStockAlert: 100, active: true, hasDelay: false },
];