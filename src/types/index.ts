export type JistotaCeny = 'zelena' | 'oranzova' | 'cervena'

export type Polozka = {
  popis: string
  mnozstvi: number
  jednotka: string
  jednotkova_cena: number
  typ: string
  jistota_ceny: JistotaCeny
  zdroj_ceny: string
}

export type Nabidka = {
  cislo?: string
  obor?: string
  misto?: string
  datum?: string
  zakaznik?: { jmeno: string; adresa?: string }
  doba_realizace?: string
  polozky: Polozka[]
  poznamka?: string
}

export type Profil = {
  jmeno: string
  ico: string
  telefon: string
  email: string
  platce_dph: boolean
  logo?: string
}
