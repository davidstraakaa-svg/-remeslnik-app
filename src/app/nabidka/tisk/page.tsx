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

const JISTOTA_LABEL = {
  zelena: '●',
  oranzova: '◐',
  cervena: '○',
}

export default function TiskPage() {
  const router = useRouter()
  const [nabidka, setNabidka] = useState<Nabidka | null>(null)
  const dnes = new Date().toLocaleDateString('cs-CZ')
  const platnostDo = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ')

  useEffect(() => {
    const raw = sessionStorage.getItem('nabidka')
    if (!raw) { router.push('/'); return }
    setNabidka(JSON.parse(raw))
  }, [router])

  useEffect(() => {
    if (nabidka) {
      setTimeout(() => window.print(), 500)
    }
  }, [nabidka])

  if (!nabidka) return null

  const celkem = nabidka.polozky.reduce((sum, p) => sum + p.mnozstvi * p.jednotkova_cena, 0)

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; color: #111; }
      `}</style>

      <div className="no-print p-4 bg-gray-100 flex gap-3">
        <button onClick={() => window.print()} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Uložit jako PDF
        </button>
        <button onClick={() => router.back()} className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm">
          Zpět
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 48px', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>CENOVÁ NABÍDKA</div>
            <div style={{ color: '#666' }}>Datum vystavení: {dnes}</div>
            <div style={{ color: '#666' }}>Platnost nabídky: {platnostDo}</div>
          </div>
          <div style={{ textAlign: 'right', color: '#666' }}>
            <div style={{ fontWeight: 600, color: '#111', marginBottom: 2 }}>Dodavatel</div>
            <div>Jméno / firma</div>
            <div>IČO: —</div>
            <div>tel: —</div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #f97316', marginBottom: 24 }} />

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, fontSize: 12, color: '#374151' }}>Popis</th>
              <th style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 600, fontSize: 12, color: '#374151', width: 60 }}>Mn.</th>
              <th style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 600, fontSize: 12, color: '#374151', width: 50 }}>Jed.</th>
              <th style={{ textAlign: 'right', padding: '8px 8px', fontWeight: 600, fontSize: 12, color: '#374151', width: 80 }}>Cena/jed.</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, fontSize: 12, color: '#374151', width: 80 }}>Celkem</th>
              <th style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 600, fontSize: 12, color: '#374151', width: 40 }}>Zdroj</th>
            </tr>
          </thead>
          <tbody>
            {nabidka.polozky.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 12px', fontSize: 12 }}>{p.popis}</td>
                <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 12 }}>{p.mnozstvi}</td>
                <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 12 }}>{p.jednotka}</td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 12 }}>{p.jednotkova_cena.toLocaleString('cs')} Kč</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, fontSize: 12 }}>{(p.mnozstvi * p.jednotkova_cena).toLocaleString('cs')} Kč</td>
                <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 14, color: p.jistota_ceny === 'zelena' ? '#16a34a' : p.jistota_ceny === 'oranzova' ? '#ea580c' : '#dc2626' }}>
                  {JISTOTA_LABEL[p.jistota_ceny]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ borderTop: '2px solid #111', paddingTop: 8, minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
              <span>Celkem bez DPH</span>
              <span>{celkem.toLocaleString('cs')} Kč</span>
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Platební podmínky: záloha 30 % před zahájením</div>
          </div>
        </div>

        {nabidka.poznamka && (
          <div style={{ backgroundColor: '#fef9f0', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', fontSize: 11, color: '#92400e', marginBottom: 24 }}>
            <strong>Poznámka:</strong> {nabidka.poznamka}
          </div>
        )}

        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
          <div>Legenda jistoty cen: ● ověřená cena (DEK/Hornbach) &nbsp;&nbsp; ◐ regionální odhad &nbsp;&nbsp; ○ zkontrolujte před odesláním</div>
          <div style={{ marginTop: 4 }}>Ceny jsou orientační a platné k datu vystavení. Nabídka je platná 14 dní.</div>
        </div>
      </div>
    </>
  )
}
