import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { SAZBA_DPH, ZALOHOVE_PROCENTO, PLATNOST_NABIDKY_DNI } from '@/lib/constants'
import type { Nabidka, Profil } from '@/types'

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

function fmt(castka: number): string {
  return castka.toLocaleString('cs-CZ') + ' Kč'
}

function buildHtml(nabidka: Nabidka, profil: Profil | null, zprava: string): string {
  const dnes = new Date()
  const platnost = new Date(dnes.getTime() + PLATNOST_NABIDKY_DNI * 24 * 60 * 60 * 1000)
  const bezDph = nabidka.polozky.reduce((s, p) => s + p.mnozstvi * p.jednotkova_cena, 0)
  const dph = profil?.platce_dph ? bezDph * SAZBA_DPH : null
  const sDph = dph !== null ? bezDph + dph : null
  const zalova = Math.round(bezDph * ZALOHOVE_PROCENTO / 100)

  const radky = nabidka.polozky.map((p, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
      <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f3f4f6;">${p.popis}</td>
      <td style="padding:8px 8px;text-align:center;font-size:13px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">${p.mnozstvi} ${p.jednotka}</td>
      <td style="padding:8px 12px;text-align:right;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;white-space:nowrap;">${fmt(Math.round(p.mnozstvi * p.jednotkova_cena))}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111;">
<div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

  <div style="background:#ea580c;padding:24px 32px;">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Cenová nabídka</h1>
    ${nabidka.cislo ? `<p style="color:#fed7aa;margin:4px 0 0;font-size:13px;">č. ${nabidka.cislo}</p>` : ''}
  </div>

  <div style="padding:28px 32px;">
    ${zprava ? `<div style="background:#fff7ed;border-left:4px solid #ea580c;padding:12px 16px;margin-bottom:24px;border-radius:4px;font-size:14px;color:#92400e;">${zprava}</div>` : ''}

    <div style="display:flex;justify-content:space-between;margin-bottom:24px;gap:16px;flex-wrap:wrap;">
      <div style="font-size:13px;color:#6b7280;line-height:1.6;">
        <div><strong>Datum:</strong> ${dnes.toLocaleDateString('cs-CZ')}</div>
        <div><strong>Platnost do:</strong> ${platnost.toLocaleDateString('cs-CZ')}</div>
        ${nabidka.doba_realizace ? `<div><strong>Doba realizace:</strong> ${nabidka.doba_realizace}</div>` : ''}
      </div>
      ${profil ? `<div style="font-size:13px;color:#6b7280;line-height:1.6;text-align:right;">
        <div style="font-weight:700;color:#111;">${profil.jmeno}</div>
        <div>IČO: ${profil.ico}</div>
        ${profil.telefon ? `<div>${profil.telefon}</div>` : ''}
        ${profil.email ? `<div>${profil.email}</div>` : ''}
        ${!profil.platce_dph ? '<div style="font-style:italic;color:#9ca3af;">Nejsem plátce DPH</div>' : ''}
      </div>` : ''}
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
          <th style="text-align:left;padding:10px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Popis</th>
          <th style="text-align:center;padding:10px 8px;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;width:90px;">Množství</th>
          <th style="text-align:right;padding:10px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;width:110px;">Celkem</th>
        </tr>
      </thead>
      <tbody>${radky}</tbody>
    </table>

    <div style="border-top:2px solid #111;padding-top:12px;text-align:right;">
      <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">
        Celkem bez DPH: <strong style="color:#111;">${fmt(Math.round(bezDph))}</strong>
      </div>
      ${dph !== null && sDph !== null ? `
      <div style="font-size:13px;color:#9ca3af;margin-bottom:4px;">DPH 21 %: ${fmt(Math.round(dph))}</div>
      <div style="font-size:17px;font-weight:700;">Celkem s DPH: ${fmt(Math.round(sDph))}</div>
      ` : ''}
      <div style="font-size:12px;color:#9ca3af;margin-top:8px;">
        Záloha ${ZALOHOVE_PROCENTO} % (${fmt(zalova)}) splatná před zahájením prací
      </div>
    </div>

    ${nabidka.poznamka ? `<div style="margin-top:20px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e;"><strong>Poznámka:</strong> ${nabidka.poznamka}</div>` : ''}
  </div>

  <div style="background:#f9fafb;padding:16px 32px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;line-height:1.6;">
    <div>Záruka na provedené práce: 24 měsíců (§ 2113 OZ). Na materiál platí záruka výrobce.</div>
    <div>Splatnost zálohy: 3 pracovní dny před zahájením. Doplatek do 14 dní od předání díla.</div>
    <div>Tato nabídka je nezávazným odhadem. Konečná cena může být upřesněna po prohlídce místa realizace.</div>
  </div>
</div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Neplatný požadavek' }, { status: 400 })
  }

  const { zakaznikEmail, zprava, nabidka, profil } = body as Record<string, unknown>

  if (typeof zakaznikEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(zakaznikEmail)) {
    return NextResponse.json({ error: 'Zadej platnou e-mailovou adresu zákazníka' }, { status: 400 })
  }

  if (!nabidka || typeof nabidka !== 'object' || !Array.isArray((nabidka as Nabidka).polozky)) {
    return NextResponse.json({ error: 'Chybí data nabídky' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'E-mailová služba není nakonfigurována — přidej RESEND_API_KEY do prostředí' }, { status: 503 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const n = nabidka as Nabidka
  const p = (profil && typeof profil === 'object') ? profil as Profil : null
  const zpravaText = typeof zprava === 'string' ? zprava.trim().slice(0, 500) : ''

  const predmet = p
    ? `Cenová nabídka od ${p.jmeno}${n.cislo ? ` č. ${n.cislo}` : ''}`
    : `Cenová nabídka${n.cislo ? ` č. ${n.cislo}` : ''}`

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: zakaznikEmail,
      subject: predmet,
      html: buildHtml(n, p, zpravaText),
      ...(p?.email ? { replyTo: p.email } : {}),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Nepodařilo se odeslat e-mail — zkontroluj RESEND_API_KEY' }, { status: 500 })
  }
}
