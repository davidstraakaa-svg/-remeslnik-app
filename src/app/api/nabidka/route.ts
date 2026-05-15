import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL ?? 'https://primary-production-9a6738.up.railway.app/webhook/nabidka'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { obor, popis, vymery } = body

  if (!popis?.trim() || !vymery?.trim() || !obor) {
    return NextResponse.json({ error: 'Chybí povinná pole' }, { status: 400 })
  }

  try {
    const res = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ obor, popis, vymery }),
      signal: AbortSignal.timeout(55000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Chyba při generování' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Generování trvalo příliš dlouho, zkus to znovu' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Neočekávaná chyba' }, { status: 500 })
  }
}
