'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nactiNabidku, nactiProfil } from '@/lib/storage'
import { formatujCenu, formatujDatum, pridejDny } from '@/lib/formatters'
import { JISTOTA_CONFIG, PLATNOST_NABIDKY_DNI, SAZBA_DPH, ZALOHOVE_PROCENTO } from '@/lib/constants'
import type { Nabidka, Profil } from '@/types'

export default function TiskPage() {
  const router = useRouter()
  const [nabidka, setNabidka] = useState<Nabidka | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)

  useEffect(() => {
    const nactena = nactiNabidku()
    if (!nactena) { router.push('/'); return }
    setNabidka(nactena)
    setProfil(nactiProfil())
  }, [router])

  useEffect(() => {
    if (nabidka) setTimeout(() => window.print(), 500)
  }, [nabidka])

  if (!nabidka) return null

  const dnes = new Date()
  const celkemBezDph = nabidka.polozky.reduce((sum, p) => sum + p.mnozstvi * p.jednotkova_cena, 0)
  const dph = profil?.platce_dph ? celkemBezDph * SAZBA_DPH : null
  const celkemSDph = dph !== null ? celkemBezDph + dph : null

  return (
    <>
      <style>{`
        @media print { body { margin: 0; } .no-print { display: none !important; } }
        body { font-family: Arial, sans-serif; color: #111; }
      `}</style>

      <nav className="no-print p-4 bg-gray-100 flex gap-3">
        <button
          onClick={() => window.print()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Uložit jako PDF
        </button>
        <button
          onClick={() => router.back()}
          className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm"
        >
          Zpět
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-12 py-10 text-sm">
        <TiskHlavicka
          profil={profil}
          cislo={nabidka.cislo}
          dnes={dnes}
          platnostDni={PLATNOST_NABIDKY_DNI}
        />

        <hr className="border-t-2 border-orange-500 my-6" />

        <TabulkaPolozek nabidka={nabidka} />

        <TiskSouhrn
          celkemBezDph={celkemBezDph}
          dph={dph}
          celkemSDph={celkemSDph}
          zalovaProcento={ZALOHOVE_PROCENTO}
        />

        {nabidka.poznamka && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-900">
            <strong>Poznámka:</strong> {nabidka.poznamka}
          </div>
        )}

        <TiskPaticka profil={profil} />
      </div>
    </>
  )
}

function TiskHlavicka({
  profil, cislo, dnes, platnostDni,
}: {
  profil: Profil | null
  cislo?: string
  dnes: Date
  platnostDni: number
}) {
  return (
    <div className="flex justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-1">CENOVÁ NABÍDKA</h1>
        {cislo && <p className="text-gray-500 text-xs">Číslo nabídky: {cislo}</p>}
        <p className="text-gray-500 text-xs">Datum vystavení: {formatujDatum(dnes)}</p>
        <p className="text-gray-500 text-xs">Platnost: {formatujDatum(pridejDny(dnes, platnostDni))}</p>
      </div>
      <div className="text-right text-gray-600 text-xs">
        <p className="font-semibold text-gray-900 text-sm mb-1">Dodavatel</p>
        {profil ? (
          <>
            <p>{profil.jmeno}</p>
            {/* P158 – odkaz na ARES pro ověření firmy */}
            <p>IČO: {profil.ico}</p>
            {profil.telefon && <p>{profil.telefon}</p>}
            {profil.email && <p>{profil.email}</p>}
            {!profil.platce_dph && <p className="mt-1 italic">Nejsem plátce DPH</p>}
          </>
        ) : (
          <p className="text-gray-400">Profil nevyplněn</p>
        )}
      </div>
    </div>
  )
}

function TabulkaPolozek({ nabidka }: { nabidka: Nabidka }) {
  return (
    <table className="w-full border-collapse mb-6">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
          <th className="text-left py-2 px-3">Popis</th>
          <th className="text-center py-2 px-2 w-14">Mn.</th>
          <th className="text-center py-2 px-2 w-12">Jed.</th>
          <th className="text-right py-2 px-2 w-20">Cena/jed.</th>
          <th className="text-right py-2 px-3 w-20">Celkem</th>
          <th className="text-center py-2 px-2 w-10">Zdroj</th>
        </tr>
      </thead>
      <tbody>
        {nabidka.polozky.map((p, i) => {
          const conf = JISTOTA_CONFIG[p.jistota_ceny] ?? JISTOTA_CONFIG.oranzova
          // P121 – zaokrouhlení na celé koruny (žádná falešná přesnost)
          const celkem = Math.round(p.mnozstvi * p.jednotkova_cena)
          return (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 px-3 text-xs">{p.popis}</td>
              <td className="py-2 px-2 text-center text-xs">{p.mnozstvi}</td>
              <td className="py-2 px-2 text-center text-xs">{p.jednotka}</td>
              <td className="py-2 px-2 text-right text-xs">{formatujCenu(Math.round(p.jednotkova_cena))}</td>
              <td className="py-2 px-3 text-right text-xs font-semibold">{formatujCenu(celkem)}</td>
              <td className="py-2 px-2 text-center text-sm" style={{ color: conf.tiskBarva }}>
                {conf.tiskSymbol}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function TiskSouhrn({ celkemBezDph, dph, celkemSDph, zalovaProcento }: {
  celkemBezDph: number
  dph: number | null
  celkemSDph: number | null
  zalovaProcento: number
}) {
  const zalova = Math.round(celkemBezDph * zalovaProcento / 100)
  return (
    <div className="flex justify-end">
      <div className="border-t-2 border-gray-900 pt-2 min-w-56">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Celkem bez DPH</span>
          <span>{formatujCenu(Math.round(celkemBezDph))}</span>
        </div>
        {dph !== null && celkemSDph !== null && (
          <>
            <div className="flex justify-between text-sm mb-1 text-gray-500">
              <span>DPH 21 %</span>
              <span>{formatujCenu(Math.round(dph))}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Celkem s DPH</span>
              <span>{formatujCenu(Math.round(celkemSDph))}</span>
            </div>
          </>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Záloha {zalovaProcento} % ({formatujCenu(zalova)}) splatná před zahájením prací
        </p>
      </div>
    </div>
  )
}

function TiskPaticka({ profil }: { profil: Profil | null }) {
  return (
    <footer className="mt-10 pt-3 border-t border-gray-200 text-xs text-gray-400 space-y-1">
      <p>Legenda: ● ověřená cena (DEK/Hornbach) &nbsp; ◐ regionální odhad &nbsp; ○ zkontrolujte před odesláním</p>
      {/* P57 – záruční podmínky */}
      <p>Záruka na provedené práce: 24 měsíců (§ 2113 a násl. zákona č. 89/2012 Sb.). Na materiál platí záruka výrobce.</p>
      {/* P58 – platební podmínky */}
      <p>Splatnost zálohy: 3 pracovní dny před zahájením. Doplatek: do 14 dní od předání díla. Platba převodem.</p>
      {/* P77 – nezávaznost nabídky */}
      <p>Tato nabídka je nezávazným odhadem. Konečná cena může být upřesněna po prohlídce místa realizace.</p>
      {/* P158 – ARES ověření */}
      {profil?.ico && (
        <p>Ověřit dodavatele: ares.gov.cz (IČO: {profil.ico})</p>
      )}
    </footer>
  )
}
