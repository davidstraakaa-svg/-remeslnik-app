'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profil } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState<Profil>({
    jmeno: '',
    ico: '',
    telefon: '',
    email: '',
    platce_dph: false,
  })
  const [chyba, setChyba] = useState('')

  function set(field: keyof Profil, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function ulozit() {
    if (!form.jmeno.trim()) { setChyba('Zadej jméno nebo název firmy'); return }
    if (!form.ico.trim()) { setChyba('Zadej IČO'); return }
    localStorage.setItem('remeslnik_profil', JSON.stringify(form))
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nastavení profilu</h1>
        <p className="text-gray-500 text-sm">Vyplníš jednou — zobrazí se v každé nabídce.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jméno / název firmy <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.jmeno}
            onChange={e => set('jmeno', e.target.value)}
            placeholder="Jan Novák / Novák zahradní služby"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            IČO <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.ico}
            onChange={e => set('ico', e.target.value)}
            placeholder="12345678"
            maxLength={8}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input
            type="tel"
            value={form.telefon}
            onChange={e => set('telefon', e.target.value)}
            placeholder="+420 123 456 789"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="jan@novak.cz"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Plátce DPH?</label>
          <div className="flex gap-3">
            <button
              onClick={() => set('platce_dph', false)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                !form.platce_dph
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              Nejsem plátce
            </button>
            <button
              onClick={() => set('platce_dph', true)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                form.platce_dph
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              Jsem plátce
            </button>
          </div>
        </div>
      </div>

      {chyba && <p className="text-red-500 text-sm mb-4">{chyba}</p>}

      <button
        onClick={ulozit}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        Uložit a pokračovat
      </button>
    </main>
  )
}
