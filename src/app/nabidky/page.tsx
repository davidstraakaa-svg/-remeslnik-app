'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nactiHistorii, smazZHistorie, ulozNabidku } from '@/lib/storage'
import { formatujCenu, formatujDatum } from '@/lib/formatters'
import { OBORY } from '@/lib/constants'
import type { Nabidka } from '@/types'

const LABEL_OBORU: Record<string, string> = Object.fromEntries(OBORY.map(o => [o.id, o.label]))

export default function NabidkyPage() {
  const router = useRouter()
  const [historie, setHistorie] = useState<Nabidka[]>([])
  const [mazaniCislo, setMazaniCislo] = useState<string | null>(null)

  useEffect(() => {
    setHistorie(nactiHistorii())
  }, [])

  function otevrit(nabidka: Nabidka) {
    ulozNabidku(nabidka)
    router.push('/nabidka')
  }

  function smazat(cislo: string) {
    smazZHistorie(cislo)
    setHistorie(nactiHistorii())
    setMazaniCislo(null)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Zpět
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Historie nabídek</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Nová
        </button>
      </header>

      {historie.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Zatím žádné nabídky.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-medium"
          >
            Vytvořit první nabídku
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {historie.map(nabidka => {
            const celkem = nabidka.polozky.reduce((s, p) => s + p.mnozstvi * p.jednotkova_cena, 0)
            const datum = nabidka.datum ? new Date(nabidka.datum) : null
            return (
              <div key={nabidka.cislo ?? nabidka.datum} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {nabidka.cislo && (
                        <span className="text-xs text-gray-400 font-mono">č. {nabidka.cislo}</span>
                      )}
                      {nabidka.obor && (
                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                          {LABEL_OBORU[nabidka.obor] ?? nabidka.obor}
                        </span>
                      )}
                    </div>
                    {nabidka.zakaznik?.jmeno && (
                      <p className="text-sm font-medium text-gray-900 mt-1">{nabidka.zakaznik.jmeno}</p>
                    )}
                    {nabidka.misto && (
                      <p className="text-xs text-gray-400">{nabidka.misto}</p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-bold text-gray-900">{formatujCenu(Math.round(celkem))}</p>
                    {datum && <p className="text-xs text-gray-400">{formatujDatum(datum)}</p>}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => otevrit(nabidka)}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Otevřít
                  </button>
                  <button
                    onClick={() => {
                      ulozNabidku({ ...nabidka, cislo: undefined, datum: undefined, zakaznik: undefined })
                      router.push('/nabidka')
                    }}
                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Duplikovat
                  </button>
                  {mazaniCislo === nabidka.cislo ? (
                    <>
                      <button
                        onClick={() => smazat(nabidka.cislo!)}
                        className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium"
                      >
                        Smazat?
                      </button>
                      <button
                        onClick={() => setMazaniCislo(null)}
                        className="py-2 px-3 bg-gray-100 text-gray-600 rounded-lg text-xs"
                      >
                        Zrušit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setMazaniCislo(nabidka.cislo ?? null)}
                      className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg text-xs transition-colors"
                    >
                      Smazat
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
