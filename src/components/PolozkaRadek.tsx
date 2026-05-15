import { useState } from 'react'
import { JISTOTA_CONFIG } from '@/lib/constants'
import { formatujCenu } from '@/lib/formatters'
import type { Polozka } from '@/types'

type Props = {
  polozka: Polozka
  upravena: boolean
  onZmena: (field: keyof Polozka, value: number) => void
}

export function PolozkaRadek({ polozka, upravena, onZmena }: Props) {
  const [otevrena, setOtevrena] = useState(false)
  const conf = JISTOTA_CONFIG[polozka.jistota_ceny] ?? JISTOTA_CONFIG.oranzova
  const celkem = polozka.mnozstvi * polozka.jednotkova_cena

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3"
        onClick={() => setOtevrena(o => !o)}
      >
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${conf.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{polozka.popis}</p>
          <p className="text-xs text-gray-400">
            {polozka.mnozstvi} {polozka.jednotka} × {formatujCenu(polozka.jednotkova_cena)}
            {upravena && ' · upraveno'}
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
          {formatujCenu(celkem)}
        </span>
      </button>

      {otevrena && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Množství</label>
              <input
                type="number"
                value={polozka.mnozstvi}
                onChange={e => onZmena('mnozstvi', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cena za {polozka.jednotka}</label>
              <input
                type="number"
                value={polozka.jednotkova_cena}
                onChange={e => onZmena('jednotkova_cena', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Typ</p>
              <p className="text-sm font-medium capitalize">{polozka.typ}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Celkem</p>
              <p className="text-sm font-bold text-gray-900">{formatujCenu(celkem)}</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${conf.badge}`}>
            <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
            {conf.label}: {polozka.zdroj_ceny}
          </div>
        </div>
      )}
    </div>
  )
}
