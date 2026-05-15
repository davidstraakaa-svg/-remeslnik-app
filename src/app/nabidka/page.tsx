'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PolozkaRadek } from '@/components/PolozkaRadek'
import { nactiNabidku, ulozNabidku } from '@/lib/storage'
import { formatujCenu } from '@/lib/formatters'
import type { Nabidka, Polozka } from '@/types'

export default function NabidkaPage() {
  const router = useRouter()
  const [nabidka, setNabidka] = useState<Nabidka | null>(null)
  const [upravy, setUpravy] = useState<Record<number, Partial<Polozka>>>({})

  useEffect(() => {
    const nactena = nactiNabidku()
    if (!nactena) { router.push('/'); return }
    setNabidka(nactena)
  }, [router])

  if (!nabidka) return null

  function upravPolozku(index: number, field: keyof Polozka, hodnota: number) {
    setUpravy(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: hodnota, jistota_ceny: 'oranzova' },
    }))
  }

  function sestavPolozky(): Polozka[] {
    return nabidka!.polozky.map((p, i) => ({ ...p, ...upravy[i] }))
  }

  function prejitNaTisk() {
    const aktualniNabidka: Nabidka = { ...nabidka, polozky: sestavPolozky() }
    ulozNabidku(aktualniNabidka)
    router.push('/nabidka/tisk')
  }

  const polozky = sestavPolozky()
  const celkem = polozky.reduce((sum, p) => sum + p.mnozstvi * p.jednotkova_cena, 0)
  const pocetCervenych = polozky.filter(p => p.jistota_ceny === 'cervena').length

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Zpět
        </button>
        <h1 className="text-xl font-bold text-gray-900">Cenová nabídka</h1>
      </header>

      {pocetCervenych > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          <strong>{pocetCervenych} {pocetCervenych === 1 ? 'položka vyžaduje' : 'položky vyžadují'} kontrolu</strong>
          {' '}— rozklikni červené a uprav cenu před odesláním.
        </div>
      )}

      <div className="space-y-2 mb-6">
        {polozky.map((polozka, i) => (
          <PolozkaRadek
            key={i}
            polozka={polozka}
            upravena={!!upravy[i]}
            onZmena={(field, hodnota) => upravPolozku(i, field, hodnota)}
          />
        ))}
      </div>

      {nabidka.poznamka && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
          {nabidka.poznamka}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Celkem bez DPH</span>
          <span className="text-xl font-bold text-gray-900">{formatujCenu(celkem)}</span>
        </div>
      </div>

      <button
        onClick={prejitNaTisk}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        Stáhnout PDF
      </button>
    </main>
  )
}
