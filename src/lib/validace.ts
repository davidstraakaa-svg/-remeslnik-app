// P37 – IČO validace (modulo 11, standard ČR algoritmus)
export function validujICO(ico: string): boolean {
  if (!/^\d{8}$/.test(ico)) return false
  const d = ico.split('').map(Number)
  const suma = d[0]*8 + d[1]*7 + d[2]*6 + d[3]*5 + d[4]*4 + d[5]*3 + d[6]*2
  const zbytek = suma % 11
  const kontrolni = zbytek === 0 ? 1 : zbytek === 1 ? 0 : 11 - zbytek
  return kontrolni === d[7]
}

// P148 – parsování čísel v českém i anglickém formátu
export function parseujCislo(hodnota: string): number {
  const cleaned = hodnota.replace(/\s/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}
