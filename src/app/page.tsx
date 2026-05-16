'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OborSelect } from '@/components/OborSelect'
import { masProfil, ulozNabidku, ulozDoHistorie, dalsiCisloNabidky, nactiHistorii } from '@/lib/storage'
import type { Nabidka, TypZakazky } from '@/types'

const KLIC_FORMULAR = 'remeslnik_formular'

const FAZE_NACITANI = [
  'Analyzuji zakázku…',
  'Hledám ceny materiálů…',
  'Sestavuji nabídku…',
  'Dokončuji…',
]

export default function HomePage() {
  const router = useRouter()
  const [obor, setObor] = useState('')
  const [typZakazky, setTypZakazky] = useState<TypZakazky>('rekonstrukce')
  const [popis, setPopis] = useState('')
  const [vymery, setVymery] = useState('')
  const [misto, setMisto] = useState('')
  const [vzdalenost, setVzdalenost] = useState('')
  const [nacitani, setNacitani] = useState(false)
  const [fazeIndex, setFazeIndex] = useState(0)
  const [chyba, setChyba] = useState('')
  const [pocetNabidek, setPocetNabidek] = useState(0)
  const odeslanoRef = useRef(false)

  useEffect(() => {
    if (!masProfil()) router.push('/onboarding')
    setPocetNabidek(nactiHistorii().length)
    document.title = 'Nová nabídka — Řemeslník'
  }, [router])

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KLIC_FORMULAR)
      if (!saved) return
      const { obor: o, typZakazky: t, popis: p, vymery: v, misto: m, vzdalenost: d } = JSON.parse(saved)
      if (o) setObor(o)
      if (t) setTypZakazky(t)
      if (p) setPopis(p)
      if (v) setVymery(v)
      if (m) setMisto(m)
      if (d) setVzdalenost(d)
    } catch { /* poškozená cache */ }
  }, [])

  useEffect(() => {
    if (!obor && !popis && !vymery) return
    try {
      sessionStorage.setItem(KLIC_FORMULAR, JSON.stringify({ obor, typZakazky, popis, vymery, misto, vzdalenost }))
    } catch { /* private mode */ }
  }, [obor, typZakazky, popis, vymery, misto, vzdalenost])

  useEffect(() => {
    if (!nacitani) { setFazeIndex(0); return }
    const interval = setInterval(
      () => setFazeIndex(i => Math.min(i + 1, FAZE_NACITANI.length - 1)),
      8000
    )
    return () => clearInterval(interval)
  }, [nacitani])

  async function odeslat() {
    if (odeslanoRef.current) return
    if (!obor) return setChyba('Vyber obor')
    if (!popis.trim()) return setChyba('Napiš popis zakázky')
    if (!vymery.trim()) return setChyba('Zadej výměry — bez nich nelze spočítat nabídku')

    setChyba('')
    setNacitani(true)
    odeslanoRef.current = true

    const vzdalenostKm = parseInt(vzdalenost) || 0

    try {
      const odpoved = await fetch('/api/nabidka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obor, typ_zakazky: typZakazky, popis, vymery, misto, vzdalenost_km: vzdalenostKm }),
      })

      const data = await odpoved.json()
      if (!odpoved.ok) throw new Error(data.error ?? 'Neznámá chyba')

      const maVarianty = Array.isArray(data.varianty) && data.varianty.length > 0

      const nabidka: Nabidka = {
        ...data,
        cislo: dalsiCisloNabidky(),
        obor,
        misto: misto.trim() || undefined,
        typ_zakazky: typZakazky,
        vzdalenost_km: vzdalenostKm || undefined,
        datum: new Date().toISOString(),
        polozky: data.polozky ?? [],
      }

      ulozNabidku(nabidka)
      // při variantách uložíme do historie až po výběru varianty
      if (!maVarianty) ulozDoHistorie(nabidka)
      sessionStorage.removeItem(KLIC_FORMULAR)
      router.push(maVarianty ? '/nabidka/varianty' : '/nabidka')
    } catch (e) {
      setChyba(e instanceof Error ? e.message : 'Nepodařilo se vygenerovat nabídku')
    } finally {
      setNacitani(false)
      odeslanoRef.current = false
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Nová nabídka</h1>
          <p className="text-gray-500 text-sm">Popiš zakázku a dostaneš cenovou nabídku během chvilky.</p>
        </div>
        <div className="flex gap-3 mt-1">
          <button onClick={() => router.push('/nabidky')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            Historie
            {pocetNabidek > 0 && (
              <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
                {pocetNabidek}
              </span>
            )}
          </button>
          <button onClick={() => router.push('/onboarding')} className="text-xs text-gray-400 hover:text-gray-600">
            Profil
          </button>
        </div>
      </header>

      <div className="space-y-6">
        <OborSelect value={obor} onChange={setObor} />

        {/* P107 – rekonstrukce vs. novostavba */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Typ zakázky</label>
          <div className="flex gap-2">
            {([
              { id: 'rekonstrukce', label: 'Rekonstrukce' },
              { id: 'novostavba', label: 'Novostavba' },
            ] as { id: TypZakazky; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTypZakazky(id)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  typZakazky === id
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {typZakazky === 'rekonstrukce'
              ? 'Zahrnuje bourání, odvoz suti a přípravu podkladu.'
              : 'Čistý podklad bez bourání.'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Popis zakázky</label>
          <textarea
            value={popis}
            onChange={e => setPopis(e.target.value)}
            placeholder="Např. Pokládka zámkové dlažby na zahradní terase, nový povrch místo trávníku..."
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Výměry <span className="text-red-500">*</span>
          </label>
          <textarea
            value={vymery}
            onChange={e => setVymery(e.target.value)}
            placeholder="Např. 40 m² plochy, tloušťka podkladu 15 cm, obvod 26 m..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">Bez výměr nelze spočítat přesnou nabídku.</p>
        </div>

        {/* P83 – místo + P54 – vzdálenost ve dvou sloupcích */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Místo realizace</label>
            <input
              value={misto}
              onChange={e => setMisto(e.target.value)}
              placeholder="Praha, Brno…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>
          <div>
            {/* P54 – vzdálenost pro automatické přidání dopravy */}
            <label className="block text-sm font-medium text-gray-700 mb-2">Vzdálenost (km)</label>
            <input
              type="number"
              min="0"
              max="500"
              value={vzdalenost}
              onChange={e => setVzdalenost(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 -mt-4">Místo upřesní regionální ceny. Vzdálenost &gt; 20 km přidá dopravu.</p>
      </div>

      {chyba && <p className="text-red-500 text-sm mt-4">{chyba}</p>}

      <button
        onClick={odeslat}
        disabled={nacitani}
        className="w-full mt-8 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        {nacitani ? FAZE_NACITANI[fazeIndex] : 'Vygenerovat nabídku'}
      </button>
    </main>
  )
}
