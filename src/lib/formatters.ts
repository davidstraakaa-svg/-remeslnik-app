export function formatujCenu(castka: number): string {
  return castka.toLocaleString('cs-CZ') + ' Kč'
}

export function formatujDatum(datum: Date): string {
  return datum.toLocaleDateString('cs-CZ')
}

export function pridejDny(datum: Date, dni: number): Date {
  return new Date(datum.getTime() + dni * 24 * 60 * 60 * 1000)
}
