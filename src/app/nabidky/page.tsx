'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nactiHistorii, smazZHistorie, ulozNabidku } from '@/lib/storage'
import { formatujCenu, formatujDatum } from '@/lib/formatters'
import { OBORY, PLATNOST_NABIDKY_DNI } from '@/lib/constants'
import type { Nabidka } from '@/types'

const LABEL_OBORU: Record<string, string> = Object.fromEntries(OBORY.map(o => [o.id, o.label]))

function platnostInfo(datum?: string): { text: string; barva: string } | null {
  if (!datum) return null
  const expiry = new Date(datum).getTime() + PLATNOST_NABIDKY_DNI * 24 * 60 * 60 * 1000
  const zbyvaDni = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000))
  if (zbyvaDni < 0) return { text: 'Expirovaná', barva: 'text-red-500' }
  if (zbyvaDni <= 3) return { text: `Platná ${zbyvaDni} d`, barva: 'text-red-500' }
  if (zbyvaDni <= 7) return { text: `Platná ${zbyvaDni} d`, barva: 'text-amber-500' }
  return { text: `Platná ${zbyvaDni} d`, barva: 'text-green-600' }
}

export default function NabidkyPage() {
  const router = useRouter()
  const [historie, setHistorie] = useState<Nabidka[]>([])
  const [mazaniCislo, setMazaniCislo] = useState<string | null>(null)
  const [hledani, setHledani] = useState('')

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

  const filtr = hledani.toLowerCase().trim()
  const filtrovane = filtr
    ? historie.filter(n =>
        n.cislo?.toLowerCase().includes(filtr) ||
        n.zakaznik?.jmeno?.toLowerCase().includes(filtr) ||
        n.misto?.toLowerCase().includes(filtr) ||
        (n.obor && LABEL_OBORU[n.obor]?.toLowerCase().includes(filtr))
      )
    : historie

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-4">
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

      {historie.length > 0 && (
        <div className="mb-4">
          <input
            value={hledani}
            onChange={e => setHledani(e.target.value)}
            placeholder="Hledat podle zákazníka, místa, čísla…"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
      )}

      {filtrovane.length === 0 ? (
        <div className="text-center py-16">
          {hledani ? (
            <p className="text-gray-400">Žádné výsledky pro „{hledani}"</p>
          ) : (
            <>
              <p className="text-gray-500 font-medium mb-1">Zatím žádné nabídky</p>
              <p className="text-gray-400 text-sm mb-6">Vytvořená nabídka se automaticky uloží sem.</p>
              <button
                onClick={() => router.push('/')}
                className="bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-semibold"
              >
                Vytvořit první nabídku
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{filtrovane.length} nabídek</p>
          <div className="space-y-3">
            {filtrovane.map(nabidka => {
              const celkem = nabidka.polozky.reduce((s, p) => s + p.mnozstvi * p.jednotkova_cena, 0)
              const datum = nabidka.datum ? new Date(nabidka.datum) : null
              const platnost = platnostInfo(nabidka.datum)
              return (
                <div key={nabidka.cislo ?? nabidka.datum} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {nabidka.cislo && (
                          <span className="text-xs text-gray-400 font-mono">č. {nabidka.cislo}</span>
                        )}
                        {nabidka.obor && (
                          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                            {LABEL_OBORU[nabidka.obor] ?? nabidka.obor}
                          </span>
                        )}
                        {platnost && (
                          <span className={`text-xs font-medium ${platnost.barva}`}>{platnost.text}</span>
                        )}
                      </div>
                      {nabidka.zakaznik?.jmeno && (
                        <p className="text-sm font-medium text-gray-900 mt-1">{nabidka.zakaznik.jmeno}</p>
                      )}
                      {nabidka.misto && (
                        <p className="text-xs text-gray-400">{nabidka.misto}</p>
                      )}
                    </div>
                    <div className="text-right ml-3 shrink-0">
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
        </>
      )}
    </main>
  )
}
