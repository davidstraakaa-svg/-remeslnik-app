'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nactiNabidku, ulozNabidku, ulozDoHistorie } from '@/lib/storage'
import { formatujCenu } from '@/lib/formatters'
import type { Nabidka } from '@/types'

const BARVY = [
  {
    obal: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    tlacitko: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    obal: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    tlacitko: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  {
    obal: 'bg-violet-50 border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    tlacitko: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
]

export default function VariantyPage() {
  const router = useRouter()
  const [nabidka, setNabidka] = useState<Nabidka | null>(null)

  useEffect(() => {
    const nactena = nactiNabidku()
    if (!nactena?.varianty?.length) { router.push('/'); return }
    setNabidka(nactena)
  }, [router])

  function vybrat(index: number) {
    if (!nabidka?.varianty) return
    const aktualizovana: Nabidka = {
      ...nabidka,
      polozky: nabidka.varianty[index].polozky,
      aktivni_varianta: index,
    }
    ulozNabidku(aktualizovana)
    ulozDoHistorie(aktualizovana)
    router.push('/nabidka')
  }

  if (!nabidka?.varianty) return null

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <header className="mb-6">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm mb-3 block">
          ← Nová zakázka
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Vyberte variantu</h1>
        <p className="text-gray-500 text-sm mt-1">Tři cenové možnosti — vyberte tu, která nejlépe sedí zákazníkovi.</p>
      </header>

      <div className="space-y-4">
        {nabidka.varianty.map((varianta, i) => {
          const celkem = varianta.polozky.reduce((s, p) => s + p.mnozstvi * p.jednotkova_cena, 0)
          const barvy = BARVY[i] ?? BARVY[2]

          return (
            <div key={i} className={`rounded-2xl border-2 p-5 ${barvy.obal}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${barvy.badge}`}>
                    {varianta.nazev}
                  </span>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{varianta.popis}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-gray-900">{formatujCenu(Math.round(celkem))}</p>
                  <p className="text-xs text-gray-400">bez DPH</p>
                </div>
              </div>

              <div className="mt-3 mb-4 space-y-1 border-t border-black/5 pt-3">
                {varianta.polozky.slice(0, 5).map((p, j) => (
                  <div key={j} className="flex justify-between text-xs text-gray-500">
                    <span className="truncate mr-2">{p.popis}</span>
                    <span className="shrink-0">{formatujCenu(Math.round(p.mnozstvi * p.jednotkova_cena))}</span>
                  </div>
                ))}
                {varianta.polozky.length > 5 && (
                  <p className="text-xs text-gray-400">+ {varianta.polozky.length - 5} dalších položek</p>
                )}
              </div>

              <button
                onClick={() => vybrat(i)}
                className={`w-full font-semibold py-3 rounded-xl text-sm transition-colors ${barvy.tlacitko}`}
              >
                Vybrat tuto variantu
              </button>
            </div>
          )
        })}
      </div>

      {nabidka.doba_realizace && (
        <p className="text-center text-xs text-gray-400 mt-6">
          Odhadovaná doba realizace: {nabidka.doba_realizace}
        </p>
      )}
    </main>
  )
}
