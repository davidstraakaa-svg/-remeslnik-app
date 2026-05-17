export type JistotaCeny = 'zelena' | 'oranzova' | 'cervena'

export type StavNabidky = 'čeká' | 'přijata' | 'odmítnuta' | 'dokončena'

export type TypZakazky = 'rekonstrukce' | 'novostavba'

export type Polozka = {
  popis: string
  mnozstvi: number
  jednotka: string
  jednotkova_cena: number
  typ: string
  jistota_ceny: JistotaCeny
  zdroj_ceny: string
}

// P86 – cenová varianta (ekonomická / standardní / prémiová)
export type Varianta = {
  nazev: string
  popis: string
  polozky: Polozka[]
}

export type Nabidka = {
  cislo?: string
  obor?: string
  misto?: string
  typ_zakazky?: TypZakazky
  vzdalenost_km?: number
  datum?: string
  zakaznik?: { jmeno: string; adresa?: string; email?: string; telefon?: string }
  doba_realizace?: string
  varianty?: Varianta[]
  aktivni_varianta?: number
  polozky: Polozka[]
  poznamka?: string
  sleva_procento?: number
  stav?: StavNabidky
}

export type Sablona = {
  id: string
  nazev: string
  obor?: string
  polozky: Polozka[]
  doba_realizace?: string
  poznamka?: string
}

export type Profil = {
  jmeno: string
  ico: string
  telefon: string
  email: string
  platce_dph: boolean
  logo?: string
  cislo_uctu?: string
  zalohove_procento?: number
  splatnost_dni?: number
}
