import type { Nabidka, Profil } from '@/types'

const KLIC_PROFIL = 'remeslnik_profil'
const KLIC_NABIDKA = 'remeslnik_nabidka'
const KLIC_CISLO = 'remeslnik_cislo'

export function nactiProfil(): Profil | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KLIC_PROFIL)
  return raw ? (JSON.parse(raw) as Profil) : null
}

export function ulozProfil(profil: Profil): void {
  localStorage.setItem(KLIC_PROFIL, JSON.stringify(profil))
}

// P52 – nabídka v localStorage místo sessionStorage (přežije zavření záložky)
export function nactiNabidku(): Nabidka | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KLIC_NABIDKA)
  return raw ? (JSON.parse(raw) as Nabidka) : null
}

export function ulozNabidku(nabidka: Nabidka): void {
  localStorage.setItem(KLIC_NABIDKA, JSON.stringify(nabidka))
}

export function masProfil(): boolean {
  return nactiProfil() !== null
}

// P42 – číslo nabídky ve formátu rok/pořadí (např. 2026/003)
export function dalsiCisloNabidky(): string {
  if (typeof window === 'undefined') return ''
  const rok = new Date().getFullYear()
  const raw = localStorage.getItem(KLIC_CISLO)
  const data = raw
    ? (JSON.parse(raw) as { rok: number; poradove: number })
    : { rok, poradove: 0 }
  const poradove = data.rok === rok ? data.poradove + 1 : 1
  localStorage.setItem(KLIC_CISLO, JSON.stringify({ rok, poradove }))
  return `${rok}/${String(poradove).padStart(3, '0')}`
}
