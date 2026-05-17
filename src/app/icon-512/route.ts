import { NextResponse } from 'next/server'

export async function GET() {
  const size = 512
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="100" fill="#ea580c"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="300" font-weight="bold" fill="white">Ř</text>
</svg>`
  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' },
  })
}
