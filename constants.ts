import { Item } from './types';

export const AVAILABLE_ITEMS: Item[] = [
  // Tamanhos (Stock represents physical containers)
  { id: 'tamanho_p', name: 'Marmita P', type: 'TAMANHO', portionSize: 1, unit: 'un', maxStock: 50, minStockAlert: 10, active: true },
  { id: 'tamanho_m', name: 'Marmita M', type: 'TAMANHO', portionSize: 1, unit: 'un', maxStock: 50, minStockAlert: 10, active: true },
  { id: 'tamanho_g', name: 'Marmita G', type: 'TAMANHO', portionSize: 1, unit: 'un', maxStock: 50, minStockAlert: 10, active: true },

  // Acompanhamentos (Stock in grams)
  { id: 'arroz_branco', name: 'Arroz Branco', type: 'ACOMPANHAMENTO', portionSize: 200, unit: 'g', maxStock: 5000, minStockAlert: 1000, active: true }, // 5kg stock
  { id: 'feijao_carioca', name: 'Feijão Carioca', type: 'ACOMPANHAMENTO', portionSize: 200, unit: 'g', maxStock: 4000, minStockAlert: 800, active: true },
  { id: 'feijao_preto', name: 'Feijão Preto', type: 'ACOMPANHAMENTO', portionSize: 200, unit: 'g', maxStock: 3000, minStockAlert: 600, active: true },
  { id: 'arroz_integral', name: 'Arroz Integral', type: 'ACOMPANHAMENTO', portionSize: 200, unit: 'g', maxStock: 2000, minStockAlert: 500, active: true },

  // Guarnições (Stock in grams or portions)
  { id: 'farofa', name: 'Farofa da Casa', type: 'GUARNICAO', portionSize: 80, unit: 'g', maxStock: 1000, minStockAlert: 200, active: true },
  { id: 'fritas', name: 'Batata Frita', type: 'GUARNICAO', portionSize: 120, unit: 'g', maxStock: 2000, minStockAlert: 500, active: true },
  { id: 'salada', name: 'Salada Mix', type: 'GUARNICAO', portionSize: 1, unit: 'porção', maxStock: 30, minStockAlert: 5, active: true },
  { id: 'legumes', name: 'Legumes Vapor', type: 'GUARNICAO', portionSize: 100, unit: 'g', maxStock: 2000, minStockAlert: 400, active: true },

  // Misturas (Stock in units)
  { id: 'bife_acebolado', name: 'Bife Acebolado', type: 'MISTURA', portionSize: 1, unit: 'un', maxStock: 40, minStockAlert: 5, active: true },
  { id: 'frango_grelhado', name: 'Filé de Frango', type: 'MISTURA', portionSize: 1, unit: 'un', maxStock: 40, minStockAlert: 5, active: true },
  { id: 'linguica', name: 'Linguiça Toscana', type: 'MISTURA', portionSize: 1, unit: 'un', maxStock: 50, minStockAlert: 10, active: true },
  { id: 'omelete', name: 'Omelete', type: 'MISTURA', portionSize: 1, unit: 'un', maxStock: 30, minStockAlert: 5, active: true },

  // Extras
  { id: 'embalagem_extra', name: 'Embalagem Extra (Separada)', type: 'EXTRA', portionSize: 1, unit: 'un', maxStock: 100, minStockAlert: 20, active: true },
];