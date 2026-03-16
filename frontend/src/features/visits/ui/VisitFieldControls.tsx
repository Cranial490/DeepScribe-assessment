import { useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { useClickOutside } from "@/shared/hooks/useClickOutside"
import type { AgeGroup } from "@/shared/types/clinical"

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

export function Field({ label, value, onChange, onBlur }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400"
      />
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useClickOutside(containerRef, () => setIsOpen(false))

  return (
    <div ref={containerRef} className="relative space-y-1">
      <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-border/80 bg-white px-3 text-left text-sm text-slate-700 outline-none transition-colors focus:border-blue-400"
      >
        <span>{value}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {isOpen ? (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border/80 bg-white p-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
              className="flex h-9 w-full items-center justify-between rounded-md px-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <span>{option}</span>
              {value === option ? <Check className="h-4 w-4 text-blue-600" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface MultiSelectFieldProps {
  label: string
  options: AgeGroup[]
  values: AgeGroup[]
  onToggle: (value: AgeGroup) => void
}

export function MultiSelectField({
  label,
  options,
  values,
  onToggle,
}: MultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useClickOutside(containerRef, () => setIsOpen(false))

  const selectedLabel = values.length > 0 ? values.join(", ") : "Not set"

  return (
    <div ref={containerRef} className="relative space-y-1">
      <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-border/80 bg-white px-3 text-left text-sm text-slate-700 outline-none transition-colors focus:border-blue-400"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {isOpen ? (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border/80 bg-white p-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className="flex h-9 w-full items-center justify-between rounded-md px-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <span>{option}</span>
              {values.includes(option) ? <Check className="h-4 w-4 text-blue-600" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
