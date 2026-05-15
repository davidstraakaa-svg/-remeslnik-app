import type { Nabidka, Profil } from '@/types'

const KLIC_PROFIL = 'remeslnik_profil'
const KLIC_NABIDKA = 'remeslnik_nabidka'

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
  const raw = sessionStorage.getItem(KLIC_NABIDKA)
  return raw ? (JSON.parse(raw) as Nabidka) : null
}

export function ulozNabidku(nabidka: Nabidka): void {
  sessionStorage.setItem(KLIC_NABIDKA, JSON.stringify(nabidka))
}

export function masProfil(): boolean {
  return nactiProfil() !== null
}
