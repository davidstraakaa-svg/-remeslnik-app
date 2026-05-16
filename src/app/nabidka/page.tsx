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
  const [zakaznikJmeno, setZakaznikJmeno] = useState('')
  const [zakaznikAdresa, setZakaznikAdresa] = useState('')
  const [zobrazBreakdown, setZobrazBreakdown] = useState(false)

  useEffect(() => {
    const nactena = nactiNabidku()
    if (!nactena) { router.push('/'); return }
    setNabidka(nactena)
    if (nactena.zakaznik) {
      setZakaznikJmeno(nactena.zakaznik.jmeno)
      setZakaznikAdresa(nactena.zakaznik.adresa ?? '')
    }
  }, [router])

  if (!nabidka) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Nabídka nebyla nalezena nebo vypršela.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-medium"
        >
          Vytvořit novou nabídku
        </button>
      </div>
    </main>
  )

  function upravPolozku(index: number, field: keyof Polozka, hodnota: number) {
    setUpravy(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: hodnota, jistota_ceny: 'oranzova' },
    }))
  }

  function obnovitPuvodni(index: number) {
    setUpravy(prev => {
      const nove = { ...prev }
      delete nove[index]
      return nove
    })
  }

  function sestavPolozky(): Polozka[] {
    return nabidka!.polozky.map((p, i) => ({ ...p, ...upravy[i] }))
  }

  function prejitNaTisk() {
    const aktualniNabidka: Nabidka = {
      ...nabidka,
      polozky: sestavPolozky(),
      zakaznik: zakaznikJmeno.trim() ? { jmeno: zakaznikJmeno.trim(), adresa: zakaznikAdresa.trim() || undefined } : undefined,
    }
    ulozNabidku(aktualniNabidka)
    router.push('/nabidka/tisk')
  }

  const polozky = sestavPolozky()
  const celkem = polozky.reduce((sum, p) => sum + p.mnozstvi * p.jednotkova_cena, 0)
  const pocetCervenych = polozky.filter(p => p.jistota_ceny === 'cervena').length

  // P183 – breakdown podle typu pro interní přehled marže
  const breakdown = polozky.reduce<Record<string, number>>((acc, p) => {
    const klic = p.typ?.toLowerCase() ?? 'ostatní'
    acc[klic] = (acc[klic] ?? 0) + p.mnozstvi * p.jednotkova_cena
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Zpět
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Cenová nabídka</h1>
          {nabidka.cislo && <p className="text-xs text-gray-400">č. {nabidka.cislo}</p>}
        </div>
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
            onObnovit={() => obnovitPuvodni(i)}
          />
        ))}
      </div>

      {nabidka.poznamka && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm text-blue-700">
          {nabidka.poznamka}
        </div>
      )}

      {/* P46 – zákazníkovy údaje pro PDF */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Zákazník (volitelné)</p>
        <div className="space-y-2">
          <input
            value={zakaznikJmeno}
            onChange={e => setZakaznikJmeno(e.target.value)}
            placeholder="Jméno zákazníka"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          <input
            value={zakaznikAdresa}
            onChange={e => setZakaznikAdresa(e.target.value)}
            placeholder="Adresa (ulice, město)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
      </div>

      {/* P183 – souhrn a interní breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Celkem bez DPH</span>
          <span className="text-xl font-bold text-gray-900">{formatujCenu(Math.round(celkem))}</span>
        </div>
        {nabidka.doba_realizace && (
          <p className="text-xs text-gray-400 mb-2">Odhadovaná doba: {nabidka.doba_realizace}</p>
        )}
        <button
          onClick={() => setZobrazBreakdown(b => !b)}
          className="text-xs text-orange-600 hover:text-orange-700"
        >
          {zobrazBreakdown ? 'Skrýt' : 'Zobrazit'} rozpad nákladů
        </button>
        {zobrazBreakdown && (
          <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
            {Object.entries(breakdown).map(([typ, castka]) => (
              <div key={typ} className="flex justify-between text-xs text-gray-500">
                <span className="capitalize">{typ}</span>
                <span>{formatujCenu(Math.round(castka))} ({Math.round(castka / celkem * 100)} %)</span>
              </div>
            ))}
          </div>
        )}
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
