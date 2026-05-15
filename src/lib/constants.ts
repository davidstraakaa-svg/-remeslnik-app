export const OBORY = [
  { id: 'zahradnik', label: 'Zahradník' },
  { id: 'instalater', label: 'Instalatér' },
  { id: 'zednik', label: 'Zedník' },
  { id: 'tesar', label: 'Tesař' },
  { id: 'malir', label: 'Malíř' },
  { id: 'podlar', label: 'Podlář' },
  { id: 'elektrikar', label: 'Elektrikář' },
  { id: 'jiny', label: 'Jiný' },
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
