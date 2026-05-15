'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Polozka = {
  popis: string
  mnozstvi: number
  jednotka: string
  jednotkova_cena: number
  typ: string
  jistota_ceny: 'zelena' | 'oranzova' | 'cervena'
  zdroj_ceny: string
}

type Nabidka = {
  polozky: Polozka[]
  poznamka?: string
}

const JISTOTA_CONFIG = {
  zelena: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700', label: 'Ověřená cena' },
  oranzova: { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700', label: 'Odhad' },
  cervena: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700', label: 'Zkontroluj' },
}

export default function NabidkaPage() {
  const router = useRouter()
  const [nabidka, setNabidka] = useState<Nabidka | null>(null)
  const [otevrenaPolozka, setOtevrenaPolozka] = useState<number | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('nabidka')
    if (!raw) { router.push('/'); return }
    setNabidka(JSON.parse(raw))
  }, [router])

  if (!nabidka) return null

  const celkem = nabidka.polozky.reduce(
    (sum, p) => sum + p.mnozstvi * p.jednotkova_cena, 0
  )

  const cervenePolozky = nabidka.polozky.filter(p => p.jistota_ceny === 'cervena').length

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
          <strong>{cervenePolozky} {cervenePolozky === 1 ? 'položka' : 'položky'} ke kontrole</strong> — zkontroluj červeně označené ceny před odesláním.
        </div>
      )}

      <div className="space-y-2 mb-6">
        {nabidka.polozky.map((p, i) => {
          const conf = JISTOTA_CONFIG[p.jistota_ceny] ?? JISTOTA_CONFIG.oranzova
          const celkemPolozka = p.mnozstvi * p.jednotkova_cena
          const otevrena = otevrenaPolozka === i

          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                onClick={() => setOtevrenaPolozka(otevrena ? null : i)}
              >
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${conf.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.popis}</p>
                  <p className="text-xs text-gray-400">{p.mnozstvi} {p.jednotka} × {p.jednotkova_cena.toLocaleString('cs')} Kč</p>
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
                      <p className="text-sm font-medium">{p.mnozstvi} {p.jednotka}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Cena za jednotku</p>
                      <p className="text-sm font-medium">{p.jednotkova_cena.toLocaleString('cs')} Kč</p>
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
        onClick={() => router.push('/nabidka/tisk')}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        Stáhnout PDF
      </button>
    </main>
  )
}
