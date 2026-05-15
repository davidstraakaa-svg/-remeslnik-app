'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nactiProfil, ulozProfil } from '@/lib/storage'
import type { Profil } from '@/types'

const PRAZDNY_PROFIL: Profil = {
  jmeno: '',
  ico: '',
  telefon: '',
  email: '',
  platce_dph: false,
}

export default function OnboardingPage() {
  const router = useRouter()
  const [profil, setProfil] = useState<Profil>(PRAZDNY_PROFIL)
  const [chyba, setChyba] = useState('')

  useEffect(() => {
    const existujici = nactiProfil()
    if (existujici) setProfil(existujici)
  }, [])

  function aktualizuj(pole: keyof Profil, hodnota: string | boolean) {
    setProfil(p => ({ ...p, [pole]: hodnota }))
  }

  function ulozit() {
    if (!profil.jmeno.trim()) return setChyba('Zadej jméno nebo název firmy')
    if (!profil.ico.trim()) return setChyba('Zadej IČO')
    ulozProfil(profil)
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nastavení profilu</h1>
        <p className="text-gray-500 text-sm">Vyplníš jednou — zobrazí se v každé nabídce.</p>
      </header>

      <div className="space-y-4 mb-6">
        <FormPole
          label="Jméno / název firmy"
          povinne
          value={profil.jmeno}
          onChange={v => aktualizuj('jmeno', v)}
          placeholder="Jan Novák / Novák zahradní služby"
        />
        <FormPole
          label="IČO"
          povinne
          value={profil.ico}
          onChange={v => aktualizuj('ico', v)}
          placeholder="12345678"
          maxLength={8}
        />
        <FormPole
          label="Telefon"
          value={profil.telefon}
          onChange={v => aktualizuj('telefon', v)}
          placeholder="+420 123 456 789"
          type="tel"
        />
        <FormPole
          label="E-mail"
          value={profil.email}
          onChange={v => aktualizuj('email', v)}
          placeholder="jan@novak.cz"
          type="email"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Plátce DPH?</label>
          <div className="flex gap-3">
            {[
              { hodnota: false, popis: 'Nejsem plátce' },
              { hodnota: true, popis: 'Jsem plátce' },
            ].map(({ hodnota, popis }) => (
              <button
                key={popis}
                onClick={() => aktualizuj('platce_dph', hodnota)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  profil.platce_dph === hodnota
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                {popis}
              </button>
            ))}
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

type FormPoleProps = {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  povinne?: boolean
  type?: string
  maxLength?: number
}

function FormPole({ label, value, onChange, placeholder, povinne, type = 'text', maxLength }: FormPoleProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {povinne && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
      />
    </div>
  )
}
