import type { Nabidka, Profil, Sablona } from '@/types'
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

export function aktualizujStavVHistorii(cislo: string, stav: import('@/types').StavNabidky): void {
  const nove = nactiHistorii().map(n => n.cislo === cislo ? { ...n, stav } : n)
  localStorage.setItem(KLIC_HISTORIE, JSON.stringify(nove))
}

export function smazZHistorie(cislo: string): void {
  const nove = nactiHistorii().filter(n => n.cislo !== cislo)
  localStorage.setItem(KLIC_HISTORIE, JSON.stringify(nove))
}

const KLIC_SABLONY = 'remeslnik_sablony'

export function nactiSablony(): Sablona[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KLIC_SABLONY)
    return raw ? (JSON.parse(raw) as Sablona[]) : []
  } catch { return [] }
}

export function ulozSablonu(sablona: Sablona): void {
  const sablony = nactiSablony().filter(s => s.id !== sablona.id)
  localStorage.setItem(KLIC_SABLONY, JSON.stringify([sablona, ...sablony].slice(0, 10)))
}

export function smazSablonu(id: string): void {
  localStorage.setItem(KLIC_SABLONY, JSON.stringify(nactiSablony().filter(s => s.id !== id)))
}

export function nactiZakazniky(): { jmeno: string; adresa?: string; email?: string; telefon?: string }[] {
  const zakaznici = new Map<string, { jmeno: string; adresa?: string; email?: string; telefon?: string }>()
  nactiHistorii().forEach(n => {
    if (n.zakaznik?.jmeno) zakaznici.set(n.zakaznik.jmeno, n.zakaznik)
  })
  return Array.from(zakaznici.values())
}
