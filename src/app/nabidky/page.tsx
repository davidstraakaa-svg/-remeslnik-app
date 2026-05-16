'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nactiHistorii, smazZHistorie, ulozNabidku, aktualizujStavVHistorii } from '@/lib/storage'
import { formatujCenu, formatujDatum } from '@/lib/formatters'
import { OBORY, PLATNOST_NABIDKY_DNI } from '@/lib/constants'
import type { Nabidka, StavNabidky } from '@/types'

const STAVY: { id: StavNabidky; label: string; barva: string }[] = [
  { id: 'čeká', label: 'Čeká', barva: 'bg-gray-100 text-gray-600' },
  { id: 'přijata', label: 'Přijata', barva: 'bg-green-100 text-green-700' },
  { id: 'odmítnuta', label: 'Odmítnuta', barva: 'bg-red-100 text-red-600' },
  { id: 'dokončena', label: 'Dokončena', barva: 'bg-blue-100 text-blue-700' },
]

type Razeni = 'datum-desc' | 'datum-asc' | 'cena-desc' | 'cena-asc'

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

function hodnota(n: Nabidka): number {
  return n.polozky.reduce((s, p) => s + p.mnozstvi * p.jednotkova_cena, 0)
}

export default function NabidkyPage() {
  const router = useRouter()
  const [historie, setHistorie] = useState<Nabidka[]>([])
  const [mazaniCislo, setMazaniCislo] = useState<string | null>(null)
  const [hledani, setHledani] = useState('')
  const [menimStavCislo, setMenimStavCislo] = useState<string | null>(null)
  const [filtrStav, setFiltrStav] = useState<StavNabidky | 'vse'>('vse')
  const [razeni, setRazeni] = useState<Razeni>('datum-desc')

  useEffect(() => {
    setHistorie(nactiHistorii())
    document.title = 'Historie nabídek — Řemeslník'
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

  function zmenitStav(cislo: string, stav: StavNabidky) {
    aktualizujStavVHistorii(cislo, stav)
    setHistorie(nactiHistorii())
    setMenimStavCislo(null)
  }

  // Statistiky
  const celkovaHodnota = historie.reduce((s, n) => s + hodnota(n), 0)
  const prijate = historie.filter(n => n.stav === 'přijata')
  const hodnotaPrijatych = prijate.reduce((s, n) => s + hodnota(n), 0)
  const uspesnost = historie.length > 0 ? Math.round(prijate.length / historie.length * 100) : 0

  // Filtrování + řazení
  const filtrText = hledani.toLowerCase().trim()
  const filtrovane = historie
    .filter(n => filtrStav === 'vse' || (n.stav ?? 'čeká') === filtrStav)
    .filter(n =>
      !filtrText ||
      n.cislo?.toLowerCase().includes(filtrText) ||
      n.zakaznik?.jmeno?.toLowerCase().includes(filtrText) ||
      n.misto?.toLowerCase().includes(filtrText) ||
      (n.obor && LABEL_OBORU[n.obor]?.toLowerCase().includes(filtrText))
    )
    .sort((a, b) => {
      switch (razeni) {
        case 'datum-asc': return (a.datum ?? '').localeCompare(b.datum ?? '')
        case 'cena-desc': return hodnota(b) - hodnota(a)
        case 'cena-asc': return hodnota(a) - hodnota(b)
        default: return (b.datum ?? '').localeCompare(a.datum ?? '')
      }
    })

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

      {/* Statistiky */}
      {historie.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Celkem</p>
            <p className="text-sm font-bold text-gray-900">{formatujCenu(Math.round(celkovaHodnota))}</p>
            <p className="text-xs text-gray-400">{historie.length} nabídek</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Přijato</p>
            <p className="text-sm font-bold text-green-600">{formatujCenu(Math.round(hodnotaPrijatych))}</p>
            <p className="text-xs text-gray-400">{prijate.length} nabídek</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Úspěšnost</p>
            <p className="text-sm font-bold text-orange-600">{uspesnost} %</p>
            <p className="text-xs text-gray-400">z nabídek</p>
          </div>
        </div>
      )}

      {/* Hledání */}
      {historie.length > 0 && (
        <div className="mb-3">
          <input
            value={hledani}
            onChange={e => setHledani(e.target.value)}
            placeholder="Hledat podle zákazníka, místa, čísla…"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
      )}

      {/* Filtr stavu + řazení */}
      {historie.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <div className="flex gap-1.5 flex-shrink-0">
            {(['vse', 'čeká', 'přijata', 'odmítnuta', 'dokončena'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFiltrStav(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filtrStav === s
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {s === 'vse' ? 'Vše' : STAVY.find(st => st.id === s)?.label ?? s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex-shrink-0">
            <select
              value={razeni}
              onChange={e => setRazeni(e.target.value as Razeni)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-400"
            >
              <option value="datum-desc">Nejnovější</option>
              <option value="datum-asc">Nejstarší</option>
              <option value="cena-desc">Nejvyšší cena</option>
              <option value="cena-asc">Nejnižší cena</option>
            </select>
          </div>
        </div>
      )}

      {filtrovane.length === 0 ? (
        <div className="text-center py-16">
          {hledani || filtrStav !== 'vse' ? (
            <p className="text-gray-400">Žádné výsledky pro tento filtr</p>
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
              const celkem = hodnota(nabidka)
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
                        {nabidka.cislo && (
                          <div className="relative">
                            <button
                              onClick={() => setMenimStavCislo(menimStavCislo === nabidka.cislo ? null : nabidka.cislo!)}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${(STAVY.find(s => s.id === nabidka.stav) ?? STAVY[0]).barva}`}
                            >
                              {(STAVY.find(s => s.id === nabidka.stav) ?? STAVY[0]).label} ▾
                            </button>
                            {menimStavCislo === nabidka.cislo && (
                              <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-32">
                                {STAVY.map(s => (
                                  <button
                                    key={s.id}
                                    onClick={() => zmenitStav(nabidka.cislo!, s.id)}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 font-medium ${s.barva.split(' ')[1]}`}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
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
