'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nactiNabidku, nactiProfil } from '@/lib/storage'
import { formatujCenu, formatujDatum, pridejDny } from '@/lib/formatters'
import { JISTOTA_CONFIG, OBORY, PLATNOST_NABIDKY_DNI, SAZBA_DPH, ZALOHOVE_PROCENTO } from '@/lib/constants'
import type { Nabidka, Profil } from '@/types'

const LABEL_OBORU: Record<string, string> = Object.fromEntries(OBORY.map(o => [o.id, o.label]))

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
    if (!nabidka) return
    document.title = nabidka.cislo ? `Nabídka č. ${nabidka.cislo}` : 'Nabídka — Řemeslník'
    setTimeout(() => window.print(), 500)
  }, [nabidka])

  if (!nabidka) return null

  const dnes = new Date()
  const brutto = nabidka.polozky.reduce((sum, p) => sum + p.mnozstvi * p.jednotkova_cena, 0)
  const slevaProc = nabidka.sleva_procento ?? 0
  const slevaKc = Math.round(brutto * slevaProc / 100)
  const celkemBezDph = brutto - slevaKc
  const dph = profil?.platce_dph ? celkemBezDph * SAZBA_DPH : null
  const celkemSDph = dph !== null ? celkemBezDph + dph : null
  const zalohaProc = profil?.zalohove_procento ?? ZALOHOVE_PROCENTO
  const splatnostDni = profil?.splatnost_dni ?? 14

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 12mm 14mm; }
        }
        body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; background: #fff; }
      `}</style>

      <nav className="no-print p-4 bg-gray-100 flex gap-3 items-center flex-wrap">
        <button
          onClick={() => window.print()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Uložit jako PDF
        </button>
        <button
          onClick={() => router.push('/nabidka')}
          className="bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Zpět na nabídku
        </button>
        {nabidka.zakaznik?.email && (
          <a
            href={`mailto:${nabidka.zakaznik.email}?subject=Cenová nabídka${nabidka.cislo ? ` č. ${nabidka.cislo}` : ''}&body=Dobrý den,%0D%0Av příloze naleznete cenovou nabídku.%0D%0A%0D%0AS pozdravem`}
            className="bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Otevřít e-mail ({nabidka.zakaznik.email})
          </a>
        )}
      </nav>

      <div className="max-w-3xl mx-auto px-10 py-8 text-sm">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {profil?.logo && (
              <img src={profil.logo} alt="Logo" style={{ maxHeight: 56, maxWidth: 180, marginBottom: 10 }} />
            )}
            {!profil?.logo && profil?.jmeno && (
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ea580c', marginBottom: 6 }}>
                {profil.jmeno}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.7 }}>
              {profil?.ico && <div>IČO: {profil.ico}</div>}
              {profil?.telefon && <div>{profil.telefon}</div>}
              {profil?.email && <div>{profil.email}</div>}
              {profil && !profil.platce_dph && <div style={{ fontStyle: 'italic' }}>Nejsem plátce DPH</div>}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: '#111' }}>CENOVÁ NABÍDKA</div>
            {nabidka.cislo && (
              <div style={{ fontSize: 13, color: '#ea580c', fontWeight: 600, marginTop: 2 }}>č. {nabidka.cislo}</div>
            )}
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6, lineHeight: 1.7 }}>
              <div>Vystaveno: {formatujDatum(dnes)}</div>
              <div>Platnost do: {formatujDatum(pridejDny(dnes, PLATNOST_NABIDKY_DNI))}</div>
              {nabidka.doba_realizace && <div>Doba realizace: {nabidka.doba_realizace}</div>}
            </div>
          </div>
        </div>

        {/* Odběratel */}
        {nabidka.zakaznik && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, marginBottom: 4 }}>Odběratel</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{nabidka.zakaznik.jmeno}</div>
            {nabidka.zakaznik.adresa && <div style={{ color: '#6b7280' }}>{nabidka.zakaznik.adresa}</div>}
            {nabidka.zakaznik.email && <div style={{ color: '#6b7280' }}>{nabidka.zakaznik.email}</div>}
          </div>
        )}

        {/* Meta info: obor, typ, místo */}
        {(nabidka.obor || nabidka.typ_zakazky || nabidka.misto) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {nabidka.obor && (
              <span style={{ background: '#fff7ed', color: '#c2410c', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                {LABEL_OBORU[nabidka.obor] ?? nabidka.obor}
              </span>
            )}
            {nabidka.typ_zakazky && (
              <span style={{ background: '#f9fafb', color: '#6b7280', borderRadius: 20, padding: '3px 10px', fontSize: 11 }}>
                {nabidka.typ_zakazky === 'rekonstrukce' ? 'Rekonstrukce' : 'Novostavba'}
              </span>
            )}
            {nabidka.misto && (
              <span style={{ background: '#f9fafb', color: '#6b7280', borderRadius: 20, padding: '3px 10px', fontSize: 11 }}>
                📍 {nabidka.misto}
              </span>
            )}
          </div>
        )}

        {/* Oranžový oddělovač */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #ea580c, #fb923c)', borderRadius: 2, marginBottom: 20 }} />

        {/* Tabulka */}
        {(() => {
          const SKUPINY = ['práce', 'materiál', 'odvoz'] as const
          type SkupinaKey = typeof SKUPINY[number] | 'ostatní'
          const NAZVY: Record<SkupinaKey, string> = { 'práce': 'Práce', 'materiál': 'Materiál', 'odvoz': 'Odvoz a likvidace', 'ostatní': 'Ostatní' }
          const grouped = new Map<SkupinaKey, typeof nabidka.polozky>()
          for (const p of nabidka.polozky) {
            const key: SkupinaKey = (SKUPINY as readonly string[]).includes(p.typ) ? p.typ as SkupinaKey : 'ostatní'
            if (!grouped.has(key)) grouped.set(key, [])
            grouped.get(key)!.push(p)
          }
          const poradiSkupin: SkupinaKey[] = ([...SKUPINY, 'ostatní'] as SkupinaKey[]).filter(k => grouped.has(k))
          const vicSkupin = poradiSkupin.length > 1
          let globalRow = 0
          return (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#1a1a1a' }}>
                  <th style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Popis</th>
                  <th style={{ textAlign: 'center', padding: '9px 8px', fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, width: 48 }}>Mn.</th>
                  <th style={{ textAlign: 'center', padding: '9px 8px', fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, width: 44 }}>Jed.</th>
                  <th style={{ textAlign: 'right', padding: '9px 8px', fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, width: 88 }}>Cena/jed.</th>
                  <th style={{ textAlign: 'right', padding: '9px 12px', fontSize: 10, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, width: 88 }}>Celkem</th>
                  <th style={{ textAlign: 'center', padding: '9px 8px', fontSize: 10, color: '#fff', width: 32 }}>●</th>
                </tr>
              </thead>
              <tbody>
                {poradiSkupin.map(skupina => {
                  const polozky = grouped.get(skupina)!
                  const subtotal = polozky.reduce((s, p) => s + Math.round(p.mnozstvi * p.jednotkova_cena), 0)
                  return (
                    <>
                      {vicSkupin && (
                        <tr key={`hdr-${skupina}`} style={{ background: '#f3f4f6' }}>
                          <td colSpan={6} style={{ padding: '6px 12px', fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {NAZVY[skupina]}
                          </td>
                        </tr>
                      )}
                      {polozky.map((p, i) => {
                        const conf = JISTOTA_CONFIG[p.jistota_ceny] ?? JISTOTA_CONFIG.oranzova
                        const celkem = Math.round(p.mnozstvi * p.jednotkova_cena)
                        const isEven = globalRow++ % 2 === 0
                        return (
                          <tr key={`${skupina}-${i}`} style={{ background: isEven ? '#ffffff' : '#f9fafb' }}>
                            <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid #f0f0f0' }}>{p.popis}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 12, borderBottom: '1px solid #f0f0f0' }}>{p.mnozstvi}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 12, borderBottom: '1px solid #f0f0f0', color: '#6b7280' }}>{p.jednotka}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 12, borderBottom: '1px solid #f0f0f0', color: '#6b7280' }}>{formatujCenu(Math.round(p.jednotkova_cena))}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, borderBottom: '1px solid #f0f0f0' }}>{formatujCenu(celkem)}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 14, borderBottom: '1px solid #f0f0f0', color: conf.tiskBarva }}>{conf.tiskSymbol}</td>
                          </tr>
                        )
                      })}
                      {vicSkupin && (
                        <tr key={`sub-${skupina}`} style={{ background: '#fafafa' }}>
                          <td colSpan={4} style={{ padding: '5px 12px', fontSize: 11, color: '#6b7280', fontStyle: 'italic', borderBottom: '1px solid #e5e7eb' }}>
                            Mezisoučet — {NAZVY[skupina].toLowerCase()}
                          </td>
                          <td style={{ padding: '5px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{formatujCenu(subtotal)}</td>
                          <td style={{ borderBottom: '1px solid #e5e7eb' }} />
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )
        })()}

        {/* Souhrn */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ minWidth: 240 }}>
            {slevaProc > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#9ca3af', borderTop: '1px solid #e5e7eb' }}>
                  <span>Mezisoučet</span>
                  <span>{formatujCenu(Math.round(brutto))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#16a34a' }}>
                  <span>Sleva {slevaProc} %</span>
                  <span>−{formatujCenu(slevaKc)}</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6b7280', borderTop: slevaProc > 0 ? 'none' : '1px solid #e5e7eb' }}>
              <span>Celkem bez DPH</span>
              <span style={{ fontWeight: 600, color: '#111' }}>{formatujCenu(Math.round(celkemBezDph))}</span>
            </div>
            {dph !== null && celkemSDph !== null && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#9ca3af' }}>
                  <span>DPH 21 %</span>
                  <span>{formatujCenu(Math.round(dph))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>
                  <span>Celkem s DPH</span>
                  <span style={{ color: '#ea580c' }}>{formatujCenu(Math.round(celkemSDph))}</span>
                </div>
              </>
            )}
            {(dph === null) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 800, borderTop: '2px solid #1a1a1a' }}>
                <span>Celkem</span>
                <span style={{ color: '#ea580c' }}>{formatujCenu(Math.round(celkemBezDph))}</span>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
              Záloha {zalohaProc} % ({formatujCenu(Math.round(celkemBezDph * zalohaProc / 100))}) před zahájením prací
            </div>
            {profil?.cislo_uctu && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                Číslo účtu: {profil.cislo_uctu}
              </div>
            )}
          </div>
        </div>

        {/* Poznámka */}
        {nabidka.poznamka && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#92400e', marginBottom: 24 }}>
            <strong>Poznámka:</strong> {nabidka.poznamka}
          </div>
        )}

        {/* Patička */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 8, fontSize: 10, color: '#9ca3af', lineHeight: 1.8 }}>
          <div>
            <span style={{ color: '#16a34a' }}>●</span> ověřená cena (DEK/Hornbach) &nbsp;
            <span style={{ color: '#ea580c' }}>◐</span> regionální odhad &nbsp;
            <span style={{ color: '#dc2626' }}>○</span> zkontrolujte před odesláním
          </div>
          <div>Záruka na provedené práce: 24 měsíců (§ 2113 a násl. zákona č. 89/2012 Sb.). Na materiál platí záruka výrobce.</div>
          <div>Záloha splatná 3 pracovní dny před zahájením. Doplatek do {splatnostDni} dní od předání díla. Platba převodem{profil?.cislo_uctu ? ` na účet ${profil.cislo_uctu}` : ''}.</div>
          <div>Tato nabídka je nezávazným odhadem. Konečná cena může být upřesněna po prohlídce místa realizace.</div>
          {profil?.ico && (
            <div>Ověřit dodavatele: ares.gov.cz (IČO: {profil.ico})</div>
          )}
        </div>
      </div>
    </>
  )
}
