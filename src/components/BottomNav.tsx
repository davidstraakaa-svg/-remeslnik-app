'use client'

import { usePathname, useRouter } from 'next/navigation'

const POLOZKY = [
  { href: '/', label: 'Nová', ikona: '✏️' },
  { href: '/nabidky', label: 'Historie', ikona: '📋' },
  { href: '/onboarding', label: 'Profil', ikona: '👤' },
]

const SKRYTA_NA = ['/nabidka/tisk', '/nabidka/varianty']

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  if (SKRYTA_NA.some(p => pathname.startsWith(p))) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-40 safe-area-pb">
      {POLOZKY.map(({ href, label, ikona }) => {
        const aktivni = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs transition-colors ${
              aktivni ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-lg leading-none">{ikona}</span>
            <span className="font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
