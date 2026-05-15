'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OborSelect } from '@/components/OborSelect'
import { masProfil } from '@/lib/storage'

export default function HomePage() {
  const router = useRouter()
  const [obor, setObor] = useState('')
  const [popis, setPopis] = useState('')
  const [vymery, setVymery] = useState('')
  const [nacitani, setNacitani] = useState(false)
  const [chyba, setChyba] = useState('')

  useEffect(() => {
    if (!masProfil()) router.push('/onboarding')
  }, [router])

  async function odeslat() {
    if (!obor) return setChyba('Vyber obor')
    if (!popis.trim()) return setChyba('Napiš popis zakázky')
    if (!vymery.trim()) return setChyba('Zadej výměry — bez nich nelze spočítat nabídku')

    setChyba('')
    setNacitani(true)

    try {
      const odpoved = await fetch('/api/nabidka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obor, popis, vymery }),
      })

      if (!odpoved.ok) {
        const { error } = await odpoved.json()
        throw new Error(error ?? 'Neznámá chyba')
      }

      const nabidka = await odpoved.json()
      sessionStorage.setItem('remeslnik_nabidka', JSON.stringify(nabidka))
      router.push('/nabidka')
    } catch (e) {
      setChyba(e instanceof Error ? e.message : 'Nepodařilo se vygenerovat nabídku')
    } finally {
      setNacitani(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Nová nabídka</h1>
          <p className="text-gray-500 text-sm">Popiš zakázku a dostaneš cenovou nabídku během chvilky.</p>
        </div>
        <button
          onClick={() => router.push('/onboarding')}
          className="text-xs text-gray-400 hover:text-gray-600 mt-1"
        >
          Profil
        </button>
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
      </div>

      {chyba && <p className="text-red-500 text-sm mt-4">{chyba}</p>}

      <button
        onClick={odeslat}
        disabled={nacitani}
        className="w-full mt-8 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        {nacitani ? 'Generuji nabídku...' : 'Vygenerovat nabídku'}
      </button>
    </main>
  )
}
