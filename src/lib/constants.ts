export const OBORY = [
  { id: 'zahradnik', label: 'Zahradník', ikona: '🌿' },
  { id: 'instalater', label: 'Instalatér', ikona: '🔧' },
  { id: 'zednik', label: 'Zedník', ikona: '🧱' },
  { id: 'tesar', label: 'Tesař', ikona: '🪚' },
  { id: 'malir', label: 'Malíř', ikona: '🖌️' },
  { id: 'podlar', label: 'Podlář', ikona: '🏠' },
  { id: 'elektrikar', label: 'Elektrikář', ikona: '⚡' },
  { id: 'pokryvac', label: 'Pokrývač', ikona: '🏗️' },
  { id: 'fve', label: 'Fotovoltaika', ikona: '☀️' },
  { id: 'jiny', label: 'Jiný obor', ikona: '🔨' },
] as const

export const JISTOTA_CONFIG = {
  zelena: {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700',
    label: 'Ověřená cena',
    tiskSymbol: '●',
    tiskBarva: '#16a34a',
  },
  oranzova: {
    dot: 'bg-orange-400',
    badge: 'bg-orange-50 text-orange-700',
    label: 'Odhad',
    tiskSymbol: '◐',
    tiskBarva: '#ea580c',
  },
  cervena: {
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700',
    label: 'Zkontroluj',
    tiskSymbol: '○',
    tiskBarva: '#dc2626',
  },
} as const

export const PLATNOST_NABIDKY_DNI = 14
export const SAZBA_DPH = 0.21
export const ZALOHOVE_PROCENTO = 30
export const MAX_HISTORIE_NABIDEK = 20
