'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { nactiProfil, ulozProfil } from '@/lib/storage'
import { validujICO } from '@/lib/validace'
import type { Profil } from '@/types'

const PRAZDNY_PROFIL: Profil = {
  jmeno: '',
  ico: '',
  telefon: '',
  email: '',
  platce_dph: false,
}

// P45 – komprese loga na max 80px výšku, JPEG 0.75
function komprimujLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxVyska = 80
      const pomer = Math.min(1, maxVyska / img.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * pomer)
      canvas.height = Math.round(img.height * pomer)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas error')); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Nepodařilo se načíst obrázek')) }
    img.src = url
  })
}

export default function OnboardingPage() {
  const router = useRouter()
  const [profil, setProfil] = useState<Profil>(PRAZDNY_PROFIL)
  const [chyba, setChyba] = useState('')
  const [icoVarovani, setIcoVarovani] = useState('')
  const [logoNacitani, setLogoNacitani] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const existujici = nactiProfil()
    if (existujici) setProfil(existujici)
    document.title = 'Profil — Řemeslník'
  }, [])

  function aktualizuj(pole: keyof Profil, hodnota: string | boolean) {
    setProfil(p => ({ ...p, [pole]: hodnota }))
    if (pole === 'ico' && typeof hodnota === 'string' && hodnota.length === 8) {
      setIcoVarovani(validujICO(hodnota) ? '' : 'IČO neprošlo kontrolním součtem — zkontroluj číslo')
    } else if (pole === 'ico') {
      setIcoVarovani('')
    }
  }

  async function nahratLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setChyba('Logo je příliš velké — max 5 MB')
      return
    }
    setLogoNacitani(true)
    try {
      const base64 = await komprimujLogo(file)
      setProfil(p => ({ ...p, logo: base64 }))
    } catch {
      setChyba('Nepodařilo se načíst logo')
    } finally {
      setLogoNacitani(false)
    }
  }

  function ulozit() {
    if (!profil.jmeno.trim()) return setChyba('Zadej jméno nebo název firmy')
    if (!profil.ico.trim()) return setChyba('Zadej IČO')
    if (profil.ico.length !== 8) return setChyba('IČO musí mít přesně 8 číslic')
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
        {/* P45 – logo firmy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo firmy</label>
          <div className="flex items-center gap-4">
            {profil.logo ? (
              <img src={profil.logo} alt="Logo" className="h-12 object-contain rounded border border-gray-200 bg-white px-2" />
            ) : (
              <div className="h-12 w-24 rounded border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                bez loga
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={logoNacitani}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {logoNacitani ? 'Nahrávám…' : profil.logo ? 'Změnit' : 'Nahrát logo'}
              </button>
              {profil.logo && (
                <button
                  onClick={() => setProfil(p => ({ ...p, logo: undefined }))}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Odebrat
                </button>
              )}
            </div>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={nahratLogo}
            className="hidden"
          />
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, max 5 MB — zobrazí se v PDF nabídce</p>
        </div>

        <FormPole
          label="Jméno / název firmy"
          povinne
          value={profil.jmeno}
          onChange={v => aktualizuj('jmeno', v)}
          placeholder="Jan Novák / Novák zahradní služby"
        />

        <div>
          <FormPole
            label="IČO"
            povinne
            value={profil.ico}
            onChange={v => aktualizuj('ico', v.replace(/\D/g, '').slice(0, 8))}
            placeholder="12345678"
            maxLength={8}
            inputMode="numeric"
          />
          {icoVarovani && (
            <p className="text-amber-600 text-xs mt-1">{icoVarovani}</p>
          )}
        </div>

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
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']
}

function FormPole({ label, value, onChange, placeholder, povinne, type = 'text', maxLength, inputMode }: FormPoleProps) {
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
        inputMode={inputMode}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
      />
    </div>
  )
}
