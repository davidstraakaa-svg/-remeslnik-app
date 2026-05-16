import { OBORY } from '@/lib/constants'

type Props = {
  value: string
  onChange: (obor: string) => void
}

export function OborSelect({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Tvůj obor</label>
      <div className="grid grid-cols-2 gap-2">
        {OBORY.map(o => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2 ${
              value === o.id
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-base">{o.ikona}</span>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
