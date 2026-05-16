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

      <nav className="no-print p-4 bg-gray-100 flex gap-3 items-center">
        <button
          onClick={() => window.print()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Uložit jako PDF
        </button>
        <button
          onClick={() => router.back()}
          className="bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Zpět
        </button>
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

        {/* Oranžový oddělovač */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #ea580c, #fb923c)', borderRadius: 2, marginBottom: 20 }} />

        {/* Tabulka */}
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
            {nabidka.polozky.map((p, i) => {
              const conf = JISTOTA_CONFIG[p.jistota_ceny] ?? JISTOTA_CONFIG.oranzova
              const celkem = Math.round(p.mnozstvi * p.jednotkova_cena)
              const isEven = i % 2 === 0
              return (
                <tr key={i} style={{ background: isEven ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid #f0f0f0' }}>{p.popis}</td>
                  <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 12, borderBottom: '1px solid #f0f0f0' }}>{p.mnozstvi}</td>
                  <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 12, borderBottom: '1px solid #f0f0f0', color: '#6b7280' }}>{p.jednotka}</td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 12, borderBottom: '1px solid #f0f0f0', color: '#6b7280' }}>{formatujCenu(Math.round(p.jednotkova_cena))}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, borderBottom: '1px solid #f0f0f0' }}>{formatujCenu(celkem)}</td>
                  <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 14, borderBottom: '1px solid #f0f0f0', color: conf.tiskBarva }}>{conf.tiskSymbol}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

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
              Záloha {ZALOHOVE_PROCENTO} % ({formatujCenu(Math.round(celkemBezDph * ZALOHOVE_PROCENTO / 100))}) před zahájením prací
            </div>
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
          <div>Záloha splatná 3 pracovní dny před zahájením. Doplatek do 14 dní od předání díla. Platba převodem.</div>
          <div>Tato nabídka je nezávazným odhadem. Konečná cena může být upřesněna po prohlídce místa realizace.</div>
          {profil?.ico && (
            <div>Ověřit dodavatele: ares.gov.cz (IČO: {profil.ico})</div>
          )}
        </div>
      </div>
    </>
  )
}
