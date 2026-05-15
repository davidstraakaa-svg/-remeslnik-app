import { NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK = 'https://primary-production-9a6738.up.railway.app/webhook/nabidka'

export async function POST(req: NextRequest) {
  const { obor, popis, vymery } = await req.json()

  const res = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ obor, popis, vymery }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Chyba n8n' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
