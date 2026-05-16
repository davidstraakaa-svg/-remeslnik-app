'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OborSelect } from '@/components/OborSelect'
import { masProfil, ulozNabidku, ulozDoHistorie, dalsiCisloNabidky } from '@/lib/storage'

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
  const [popis, setPopis] = useState('')
  const [vymery, setVymery] = useState('')
  const [misto, setMisto] = useState('')
  const [nacitani, setNacitani] = useState(false)
  const [fazeIndex, setFazeIndex] = useState(0)
  const [chyba, setChyba] = useState('')
  const odeslanoRef = useRef(false)

  useEffect(() => {
    if (!masProfil()) router.push('/onboarding')
  }, [router])

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KLIC_FORMULAR)
      if (!saved) return
      const { obor: o, popis: p, vymery: v, misto: m } = JSON.parse(saved)
      if (o) setObor(o)
      if (p) setPopis(p)
      if (v) setVymery(v)
      if (m) setMisto(m)
    } catch { /* poškozená cache */ }
  }, [])

  useEffect(() => {
    if (!obor && !popis && !vymery) return
    try {
      sessionStorage.setItem(KLIC_FORMULAR, JSON.stringify({ obor, popis, vymery, misto }))
    } catch { /* private mode */ }
  }, [obor, popis, vymery, misto])

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

    try {
      const odpoved = await fetch('/api/nabidka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obor, popis, vymery, misto }),
      })

      const data = await odpoved.json()
      if (!odpoved.ok) throw new Error(data.error ?? 'Neznámá chyba')

      const nabidka = {
        ...data,
        cislo: dalsiCisloNabidky(),
        obor,
        misto: misto.trim() || undefined,
        datum: new Date().toISOString(),
      }

      ulozNabidku(nabidka)
      ulozDoHistorie(nabidka)
      sessionStorage.removeItem(KLIC_FORMULAR)
      router.push('/nabidka')
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
          <button
            onClick={() => router.push('/nabidky')}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Historie
          </button>
          <button
            onClick={() => router.push('/onboarding')}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Profil
          </button>
        </div>
      </header>

      <div className="space-y-6">
        <OborSelect value={obor} onChange={setObor} />

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

        {/* P83 – místo realizace pro regionální ceny */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Místo realizace</label>
          <input
            value={misto}
            onChange={e => setMisto(e.target.value)}
            placeholder="Např. Praha, Brno, Jihočeský kraj…"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">Volitelné — upřesní regionální ceny práce.</p>
        </div>
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
