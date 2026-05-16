'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PolozkaRadek } from '@/components/PolozkaRadek'
import { nactiNabidku, ulozNabidku, nactiProfil } from '@/lib/storage'
import { formatujCenu } from '@/lib/formatters'
import { PLATNOST_NABIDKY_DNI, SAZBA_DPH, ZALOHOVE_PROCENTO } from '@/lib/constants'
import type { Nabidka, Polozka, Profil } from '@/types'

const NAZVY_VARIANT = ['Ekonomická', 'Standardní', 'Prémiová']
const BARVY_VARIANT = ['text-emerald-600 bg-emerald-50', 'text-orange-600 bg-orange-50', 'text-violet-600 bg-violet-50']

function platnostInfo(datum?: string): { text: string; barva: string } | null {
  if (!datum) return null
  const expiry = new Date(datum).getTime() + PLATNOST_NABIDKY_DNI * 24 * 60 * 60 * 1000
  const zbyvaDni = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000))
  if (zbyvaDni < 0) return { text: 'Nabídka expirovala', barva: 'text-red-600 bg-red-50 border-red-200' }
  if (zbyvaDni <= 3) return { text: `Platná ještě ${zbyvaDni} den`, barva: 'text-red-600 bg-red-50 border-red-200' }
  if (zbyvaDni <= 7) return { text: `Platná ještě ${zbyvaDni} dní`, barva: 'text-amber-600 bg-amber-50 border-amber-200' }
  return { text: `Platná ${zbyvaDni} dní`, barva: 'text-green-700 bg-green-50 border-green-200' }
}

export default function NabidkaPage() {
  const router = useRouter()
  const [nabidka, setNabidka] = useState<Nabidka | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [upravy, setUpravy] = useState<Record<number, Partial<Polozka>>>({})
  const [zakaznikJmeno, setZakaznikJmeno] = useState('')
  const [zakaznikAdresa, setZakaznikAdresa] = useState('')
  const [zakaznikEmail, setZakaznikEmail] = useState('')
  const [smazane, setSmazane] = useState<Set<number>>(new Set())
  const [prilohy, setPrilohy] = useState<Polozka[]>([])
  const [zobrazPridatFormumar, setZobrazPridatFormular] = useState(false)
  const [novaPopis, setNovaPopis] = useState('')
  const [novaMnozstvi, setNovaMnozstvi] = useState('1')
  const [novaJednotka, setNovaJednotka] = useState('hod')
  const [novaCena, setNovaCena] = useState('')
  const [novaTyp, setNovaTyp] = useState('práce')
  const [zobrazBreakdown, setZobrazBreakdown] = useState(false)
  const [zobrazEmail, setZobrazEmail] = useState(false)
  const [emailAdresa, setEmailAdresa] = useState('')
  const [emailZprava, setEmailZprava] = useState('')
  const [emailStav, setEmailStav] = useState<'idle' | 'odesila' | 'ok' | 'chyba'>('idle')
  const [emailChyba, setEmailChyba] = useState('')
  const emailOdeslanRef = useRef(false)

  useEffect(() => {
    const nactena = nactiNabidku()
    if (!nactena) { router.push('/'); return }
    setNabidka(nactena)
    setProfil(nactiProfil())
    document.title = nactena.cislo ? `Nabídka č. ${nactena.cislo} — Řemeslník` : 'Nabídka — Řemeslník'
    if (nactena.zakaznik) {
      setZakaznikJmeno(nactena.zakaznik.jmeno)
      setZakaznikAdresa(nactena.zakaznik.adresa ?? '')
      setZakaznikEmail(nactena.zakaznik.email ?? '')
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
    const original = nabidka!.polozky
      .map((p, i) => ({ polozka: { ...p, ...upravy[i] }, index: i }))
      .filter(({ index }) => !smazane.has(index))
      .map(({ polozka }) => polozka)
    return [...original, ...prilohy]
  }

  function smazatPolozku(originalIndex: number) {
    setSmazane(prev => new Set([...prev, originalIndex]))
  }

  function pridatPolozku() {
    if (!novaPopis.trim() || !novaCena) return
    const nova: Polozka = {
      popis: novaPopis.trim(),
      mnozstvi: parseFloat(novaMnozstvi) || 1,
      jednotka: novaJednotka,
      jednotkova_cena: parseFloat(novaCena) || 0,
      typ: novaTyp,
      jistota_ceny: 'oranzova',
      zdroj_ceny: 'vlastní',
    }
    setPrilohy(prev => [...prev, nova])
    setNovaPopis('')
    setNovaMnozstvi('1')
    setNovaCena('')
    setZobrazPridatFormular(false)
  }

  function sestavZakaznika() {
    if (!zakaznikJmeno.trim()) return nabidka!.zakaznik
    return {
      jmeno: zakaznikJmeno.trim(),
      adresa: zakaznikAdresa.trim() || undefined,
      email: zakaznikEmail.trim() || undefined,
    }
  }

  async function odeslatEmail() {
    if (emailOdeslanRef.current) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAdresa)) {
      setEmailChyba('Zadej platnou e-mailovou adresu')
      return
    }
    emailOdeslanRef.current = true
    setEmailStav('odesila')
    setEmailChyba('')

    const aktualniNabidka: Nabidka = {
      ...nabidka!,
      polozky: sestavPolozky(),
      zakaznik: sestavZakaznika(),
    }

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zakaznikEmail: emailAdresa.trim(),
          zprava: emailZprava.trim(),
          nabidka: aktualniNabidka,
          profil,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Chyba')
      setEmailStav('ok')
    } catch (e) {
      setEmailChyba(e instanceof Error ? e.message : 'Nepodařilo se odeslat e-mail')
      setEmailStav('chyba')
    } finally {
      emailOdeslanRef.current = false
    }
  }

  function prejitNaTisk() {
    const aktualniNabidka: Nabidka = {
      ...nabidka,
      polozky: sestavPolozky(),
      zakaznik: sestavZakaznika(),
    }
    ulozNabidku(aktualniNabidka)
    router.push('/nabidka/tisk')
  }

  const polozky = sestavPolozky()
  const celkem = polozky.reduce((sum, p) => sum + p.mnozstvi * p.jednotkova_cena, 0)
  const pocetCervenych = polozky.filter(p => p.jistota_ceny === 'cervena').length
  const platnost = platnostInfo(nabidka.datum)

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
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {nabidka.cislo && <p className="text-xs text-gray-400">č. {nabidka.cislo}</p>}
            {nabidka.aktivni_varianta !== undefined && nabidka.varianty?.[nabidka.aktivni_varianta] && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BARVY_VARIANT[nabidka.aktivni_varianta] ?? BARVY_VARIANT[2]}`}>
                {NAZVY_VARIANT[nabidka.aktivni_varianta] ?? nabidka.varianty[nabidka.aktivni_varianta].nazev}
              </span>
            )}
          </div>
        </div>
      </header>

      {platnost && (
        <div className={`border rounded-xl px-4 py-2.5 mb-4 text-xs font-medium ${platnost.barva}`}>
          {platnost.text}
        </div>
      )}

      {pocetCervenych > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          <strong>{pocetCervenych} {pocetCervenych === 1 ? 'položka vyžaduje' : 'položky vyžadují'} kontrolu</strong>
          {' '}— rozklikni červené a uprav cenu před odesláním.
        </div>
      )}

      <div className="space-y-2 mb-3">
        {nabidka.polozky.map((polozka, i) => {
          if (smazane.has(i)) return null
          return (
            <PolozkaRadek
              key={i}
              polozka={{ ...polozka, ...upravy[i] }}
              upravena={!!upravy[i]}
              onZmena={(field, hodnota) => upravPolozku(i, field, hodnota)}
              onObnovit={() => obnovitPuvodni(i)}
              onSmazat={() => smazatPolozku(i)}
            />
          )
        })}
        {prilohy.map((polozka, i) => (
          <PolozkaRadek
            key={`priloha-${i}`}
            polozka={polozka}
            upravena={false}
            onZmena={() => {}}
            onObnovit={() => {}}
            onSmazat={() => setPrilohy(prev => prev.filter((_, j) => j !== i))}
          />
        ))}
      </div>

      {zobrazPridatFormumar ? (
        <div className="bg-white rounded-xl border border-orange-200 p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Nová položka</p>
          <input
            value={novaPopis}
            onChange={e => setNovaPopis(e.target.value)}
            placeholder="Popis položky"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={novaMnozstvi}
              onChange={e => setNovaMnozstvi(e.target.value)}
              placeholder="Mn."
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
            <input
              value={novaJednotka}
              onChange={e => setNovaJednotka(e.target.value)}
              placeholder="Jed."
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
            <input
              type="number"
              value={novaCena}
              onChange={e => setNovaCena(e.target.value)}
              placeholder="Kč/jed."
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>
          <select
            value={novaTyp}
            onChange={e => setNovaTyp(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="práce">Práce</option>
            <option value="materiál">Materiál</option>
            <option value="odvoz">Odvoz</option>
          </select>
          <div className="flex gap-2">
            <button onClick={pridatPolozku} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              Přidat
            </button>
            <button onClick={() => setZobrazPridatFormular(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
              Zrušit
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setZobrazPridatFormular(true)}
          className="w-full mb-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
        >
          + Přidat vlastní položku
        </button>
      )}

      {nabidka.poznamka && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm text-blue-700">
          {nabidka.poznamka}
        </div>
      )}

      {/* Zákazník */}
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
          <input
            type="email"
            value={zakaznikEmail}
            onChange={e => {
              setZakaznikEmail(e.target.value)
              if (!emailAdresa) setEmailAdresa(e.target.value)
            }}
            placeholder="E-mail zákazníka"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
      </div>

      {/* Souhrn */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Celkem bez DPH</span>
          <span className="text-xl font-bold text-gray-900">{formatujCenu(Math.round(celkem))}</span>
        </div>
        {profil?.platce_dph && (
          <>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-400 text-xs">DPH 21 %</span>
              <span className="text-sm text-gray-500">{formatujCenu(Math.round(celkem * SAZBA_DPH))}</span>
            </div>
            <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-100">
              <span className="text-gray-700 text-sm font-semibold">Celkem s DPH</span>
              <span className="text-lg font-bold text-orange-600">{formatujCenu(Math.round(celkem * (1 + SAZBA_DPH)))}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
          <span className="text-gray-400 text-xs">Záloha {ZALOHOVE_PROCENTO} %</span>
          <span className="text-xs text-gray-500">{formatujCenu(Math.round(celkem * ZALOHOVE_PROCENTO / 100))}</span>
        </div>
        {nabidka.doba_realizace && (
          <p className="text-xs text-gray-400 mt-2">Odhadovaná doba: {nabidka.doba_realizace}</p>
        )}
        <button
          onClick={() => setZobrazBreakdown(b => !b)}
          className="text-xs text-orange-600 hover:text-orange-700 mt-2 block"
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

      <div className="flex gap-3">
        <button
          onClick={prejitNaTisk}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-base transition-colors"
        >
          Stáhnout PDF
        </button>
        <button
          onClick={() => {
            setZobrazEmail(e => !e)
            setEmailStav('idle')
            setEmailChyba('')
            if (!emailAdresa && zakaznikEmail) setEmailAdresa(zakaznikEmail)
          }}
          className="px-5 py-4 rounded-xl border-2 border-orange-200 text-orange-600 hover:border-orange-400 font-semibold text-base transition-colors bg-white"
          title="Odeslat zákazníkovi e-mailem"
        >
          ✉
        </button>
      </div>

      {zobrazEmail && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Odeslat nabídku zákazníkovi</p>

          {emailStav === 'ok' ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-semibold text-sm">E-mail byl odeslán.</p>
              <button onClick={() => { setEmailStav('idle'); setEmailAdresa(''); setEmailZprava('') }} className="text-xs text-gray-400 mt-2 underline">
                Odeslat znovu
              </button>
            </div>
          ) : (
            <>
              <input
                type="email"
                value={emailAdresa}
                onChange={e => setEmailAdresa(e.target.value)}
                placeholder="E-mail zákazníka"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
              <textarea
                value={emailZprava}
                onChange={e => setEmailZprava(e.target.value)}
                placeholder="Průvodní zpráva (volitelné)"
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white"
              />
              {emailChyba && <p className="text-red-500 text-xs">{emailChyba}</p>}
              <button
                onClick={odeslatEmail}
                disabled={emailStav === 'odesila'}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
              >
                {emailStav === 'odesila' ? 'Odesílám…' : 'Odeslat e-mail'}
              </button>
            </>
          )}
        </div>
      )}
    </main>
  )
}
