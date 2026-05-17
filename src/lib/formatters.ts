export function formatujCenu(castka: number): string {
  return castka.toLocaleString('cs-CZ') + ' Kč'
}

export function platnostInfo(datum?: string, platnostDni = 14): { text: string; barva: string } | null {
  if (!datum) return null
  const expiry = new Date(datum).getTime() + platnostDni * 24 * 60 * 60 * 1000
  const zbyvaDni = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000))
  if (zbyvaDni < 0) return { text: 'Expirovaná', barva: 'text-red-500' }
  if (zbyvaDni <= 3) return { text: `Platná ${zbyvaDni} d`, barva: 'text-red-500' }
  if (zbyvaDni <= 7) return { text: `Platná ${zbyvaDni} d`, barva: 'text-amber-500' }
  return { text: `Platná ${zbyvaDni} d`, barva: 'text-green-600' }
}

export function formatujDatum(datum: Date): string {
  return datum.toLocaleDateString('cs-CZ')
}

export function pridejDny(datum: Date, dni: number): Date {
  return new Date(datum.getTime() + dni * 24 * 60 * 60 * 1000)
}
