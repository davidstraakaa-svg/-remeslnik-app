'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Nabidka, Polozka } from '@/types'

const JISTOTA_CONFIG = {
  zelena: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700', label: 'Ověřená cena' },
  oranzova: { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700', label: 'Odhad' },
  cervena: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700', label: 'Zkontroluj' },
}

export default function NabidkaPage() {
  const router = useRouter()
  const [nabidka, setNabidka] = useState<Nabidka | null>(null)
  const [otevrenaPolozka, setOtevrenaPolozka] = useState<number | null>(null)
  const [editovana, setEditovana] = useState<Record<number, Partial<Polozka>>>({})

  useEffect(() => {
    const raw = sessionStorage.getItem('nabidka')
    if (!raw) { router.push('/'); return }
    setNabidka(JSON.parse(raw))
  }, [router])

  if (!nabidka) return null

  function getPolozka(i: number): Polozka {
    return { ...nabidka!.polozky[i], ...editovana[i] }
  }

  function updatePolozka(i: number, field: keyof Polozka, value: string | number) {
    setEditovana(prev => ({
      ...prev,
      [i]: { ...prev[i], [field]: value, jistota_ceny: 'oranzova' },
    }))
  }

  const polozky = nabidka.polozky.map((_, i) => getPolozka(i))
  const celkem = polozky.reduce((sum, p) => sum + p.mnozstvi * p.jednotkova_cena, 0)
  const cervenePolozky = polozky.filter(p => p.jistota_ceny === 'cervena').length

  function ulozitAJitNaTisk() {
    const upravenaNabidka = { ...nabidka, polozky }
    sessionStorage.setItem('nabidka', JSON.stringify(upravenaNabidka))
    router.push('/nabidka/tisk')
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Zpět
        </button>
        <h1 className="text-xl font-bold text-gray-900">Cenová nabídka</h1>
      </div>

      {cervenePolozky > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          <strong>{cervenePolozky} {cervenePolozky === 1 ? 'položka vyžaduje' : 'položky vyžadují'} kontrolu</strong> — rozklikni červené a uprav cenu před odesláním.
        </div>
      )}

      <div className="space-y-2 mb-6">
        {polozky.map((p, i) => {
          const conf = JISTOTA_CONFIG[p.jistota_ceny] ?? JISTOTA_CONFIG.oranzova
          const celkemPolozka = p.mnozstvi * p.jednotkova_cena
          const otevrena = otevrenaPolozka === i
          const upravena = !!editovana[i]

          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                onClick={() => setOtevrenaPolozka(otevrena ? null : i)}
              >
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${conf.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.popis}</p>
                  <p className="text-xs text-gray-400">{p.mnozstvi} {p.jednotka} × {p.jednotkova_cena.toLocaleString('cs')} Kč{upravena ? ' · upraveno' : ''}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  {celkemPolozka.toLocaleString('cs')} Kč
                </span>
              </button>

              {otevrena && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Množství</p>
                      <input
                        type="number"
                        value={p.mnozstvi}
                        onChange={e => updatePolozka(i, 'mnozstvi', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Cena za {p.jednotka}</p>
                      <input
                        type="number"
                        value={p.jednotkova_cena}
                        onChange={e => updatePolozka(i, 'jednotkova_cena', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Typ</p>
                      <p className="text-sm font-medium capitalize">{p.typ}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Celkem</p>
                      <p className="text-sm font-bold text-gray-900">{celkemPolozka.toLocaleString('cs')} Kč</p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${conf.badge}`}>
                    <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                    {conf.label}: {p.zdroj_ceny}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {nabidka.poznamka && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
          {nabidka.poznamka}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Celkem bez DPH</span>
          <span className="text-xl font-bold text-gray-900">{celkem.toLocaleString('cs')} Kč</span>
        </div>
      </div>

      <button
        onClick={ulozitAJitNaTisk}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        Stáhnout PDF
      </button>
    </main>
  )
}
