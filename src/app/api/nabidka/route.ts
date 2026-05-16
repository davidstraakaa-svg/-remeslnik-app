import { NextRequest, NextResponse } from 'next/server'
import { OBORY } from '@/lib/constants'

const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL ?? 'https://primary-production-9a6738.up.railway.app/webhook/nabidka'
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? ''

export const maxDuration = 60

const POVOLENE_OBORY = new Set<string>(OBORY.map(o => o.id))

// P36 – ochrana před prompt injection a XSS
function sanitizujText(text: string, maxDelka: number): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxDelka)
}

// P50/P63 – validace struktury odpovědi z n8n
function validujSchema(data: unknown): data is { polozky: unknown[]; poznamka?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'polozky' in data &&
    Array.isArray((data as { polozky: unknown }).polozky) &&
    (data as { polozky: unknown[] }).polozky.length > 0
  )
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Neplatný formát požadavku' }, { status: 400 })
  }

  const { obor, popis, vymery, misto, typ_zakazky, vzdalenost_km } = body as Record<string, unknown>

  // P36 – whitelist validace oboru (ne jen prázdný string)
  if (typeof obor !== 'string' || !POVOLENE_OBORY.has(obor)) {
    return NextResponse.json({ error: 'Vyber platný obor' }, { status: 400 })
  }

  if (typeof popis !== 'string' || !popis.trim()) {
    return NextResponse.json({ error: 'Zadej popis zakázky' }, { status: 400 })
  }

  if (typeof vymery !== 'string' || !vymery.trim()) {
    return NextResponse.json({ error: 'Zadej výměry zakázky' }, { status: 400 })
  }

  const cistePopis = sanitizujText(popis, 1000)
  const cisteVymery = sanitizujText(vymery, 500)
  const cisteMisto = typeof misto === 'string' ? sanitizujText(misto, 100) : ''
  const cisteTyp = typ_zakazky === 'novostavba' ? 'novostavba' : 'rekonstrukce'
  const cisteVzdalenost = typeof vzdalenost_km === 'number' && vzdalenost_km > 0 ? Math.min(vzdalenost_km, 500) : 0

  if (!cistePopis) {
    return NextResponse.json({ error: 'Popis zakázky nesmí být prázdný' }, { status: 400 })
  }

  // P40 – autentizace webhookového volání sdíleným tajemstvím
  const hlavicky: Record<string, string> = { 'Content-Type': 'application/json' }
  if (WEBHOOK_SECRET) hlavicky['X-Webhook-Secret'] = WEBHOOK_SECRET

  try {
    const res = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: hlavicky,
      body: JSON.stringify({ obor, popis: cistePopis, vymery: cisteVymery, misto: cisteMisto, typ_zakazky: cisteTyp, vzdalenost_km: cisteVzdalenost }),
      signal: AbortSignal.timeout(55000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Chyba při generování nabídky — zkus to znovu za chvíli' },
        { status: 502 }
      )
    }

    // P63 – n8n někdy vrátí HTML chybovou stránku místo JSON
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Neočekávaná odpověď ze serveru — zkus to znovu' },
        { status: 502 }
      )
    }

    const data = await res.json()

    // P50 – validace že výstup má správnou strukturu
    if (!validujSchema(data)) {
      return NextResponse.json(
        { error: 'Nabídku se nepodařilo sestavit — zkus přeformulovat popis zakázky' },
        { status: 502 }
      )
    }

    return NextResponse.json(data)
  } catch (e) {
    // P164 – specifické error messages podle typu chyby
    if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
      return NextResponse.json(
        { error: 'Generování trvalo příliš dlouho — zkus zkrátit popis nebo výměry' },
        { status: 504 }
      )
    }
    return NextResponse.json({ error: 'Neočekávaná chyba — zkus to znovu' }, { status: 500 })
  }
}
