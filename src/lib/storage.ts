import type { Nabidka, Profil } from '@/types'
import { MAX_HISTORIE_NABIDEK } from '@/lib/constants'

const KLIC_PROFIL = 'remeslnik_profil'
const KLIC_NABIDKA = 'remeslnik_nabidka'
const KLIC_CISLO = 'remeslnik_cislo'
const KLIC_HISTORIE = 'remeslnik_historie'

export function nactiProfil(): Profil | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KLIC_PROFIL)
  return raw ? (JSON.parse(raw) as Profil) : null
}

export function ulozProfil(profil: Profil): void {
  localStorage.setItem(KLIC_PROFIL, JSON.stringify(profil))
}

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

// P127 – historie nabídek (max 20, FIFO)
export function nactiHistorii(): Nabidka[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KLIC_HISTORIE)
    return raw ? (JSON.parse(raw) as Nabidka[]) : []
  } catch {
    return []
  }
}

export function ulozDoHistorie(nabidka: Nabidka): void {
  const historie = nactiHistorii()
  const bez = historie.filter(n => n.cislo !== nabidka.cislo)
  const nova = [nabidka, ...bez].slice(0, MAX_HISTORIE_NABIDEK)
  localStorage.setItem(KLIC_HISTORIE, JSON.stringify(nova))
}

export function smazZHistorie(cislo: string): void {
  const nove = nactiHistorii().filter(n => n.cislo !== cislo)
  localStorage.setItem(KLIC_HISTORIE, JSON.stringify(nove))
}

export function nactiZakazniky(): { jmeno: string; adresa?: string; email?: string }[] {
  const zakaznici = new Map<string, { jmeno: string; adresa?: string; email?: string }>()
  nactiHistorii().forEach(n => {
    if (n.zakaznik?.jmeno) zakaznici.set(n.zakaznik.jmeno, n.zakaznik)
  })
  return Array.from(zakaznici.values())
}
