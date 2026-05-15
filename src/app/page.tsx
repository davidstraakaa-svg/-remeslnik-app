'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const OBORY = [
  { id: 'zahradnik', label: 'Zahradník' },
  { id: 'instalater', label: 'Instalatér' },
  { id: 'zednik', label: 'Zedník' },
  { id: 'tesar', label: 'Tesař' },
  { id: 'malir', label: 'Malíř' },
  { id: 'podlar', label: 'Podlář' },
  { id: 'elektrikar', label: 'Elektrikář' },
  { id: 'jiny', label: 'Jiný' },
]

export default function Home() {
  const router = useRouter()
  const [obor, setObor] = useState('')
  const [popis, setPopis] = useState('')
  const [vymery, setVymery] = useState('')
  const [loading, setLoading] = useState(false)
  const [chyba, setChyba] = useState('')

  async function odeslat() {
    if (!obor) { setChyba('Vyber obor'); return }
    if (!popis.trim()) { setChyba('Napiš popis zakázky'); return }
    if (!vymery.trim()) { setChyba('Zadej výměry — bez nich nelze spočítat nabídku'); return }

    setChyba('')
    setLoading(true)

    try {
      const res = await fetch('/api/nabidka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obor, popis, vymery }),
      })

      if (!res.ok) throw new Error()

      const data = await res.json()
      sessionStorage.setItem('nabidka', JSON.stringify(data))
      sessionStorage.setItem('zakazka', JSON.stringify({ obor, popis, vymery }))
      router.push('/nabidka')
    } catch {
      setChyba('Nepodařilo se vygenerovat nabídku. Zkus to znovu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Nová nabídka</h1>
      <p className="text-gray-500 mb-8 text-sm">Popiš zakázku a dostaneš cenovou nabídku během chvilky.</p>

      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tvůj obor</label>
        <div className="grid grid-cols-2 gap-2">
          {OBORY.map(o => (
            <button
              key={o.id}
              onClick={() => setObor(o.id)}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                obor === o.id
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Popis zakázky</label>
        <textarea
          value={popis}
          onChange={e => setPopis(e.target.value)}
          placeholder="Např. Pokládka zámkové dlažby na zahradní terase, nový povrch místo trávníku..."
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white"
        />
      </section>

      <section className="mb-8">
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
      </section>

      {chyba && (
        <p className="text-red-500 text-sm mb-4">{chyba}</p>
      )}

      <button
        onClick={odeslat}
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        {loading ? 'Generuji nabídku...' : 'Vygenerovat nabídku'}
      </button>
    </main>
  )
}
