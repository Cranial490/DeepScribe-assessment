import { Search, Sparkles, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PATIENT_BREADCRUMBS } from "@/features/patient-selection/model/constants"
import { PatientSelectionTable } from "@/features/patient-selection/ui/PatientSelectionTable"
import type { PatientRecord } from "@/features/patient-selection/model/types"
import type { ChangeEvent } from "react"

interface PatientSelectionScreenProps {
  query: string
  patients: ReadonlyArray<PatientRecord>
  visibleCountLabel: string
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/**
 * Presentational screen for trial patient selection.
 */
export function PatientSelectionScreen({
  query,
  patients,
  visibleCountLabel,
  onQueryChange,
}: PatientSelectionScreenProps) {
  return (
    <div className="min-h-screen bg-[#f5f7fc] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        <aside className="flex flex-col border-r border-border/70 bg-white/80 backdrop-blur-sm">
          <div className="px-8 pb-6 pt-10">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span className="text-3xl font-semibold tracking-tight">
                DeepScribe
              </span>
            </div>
          </div>

          <nav className="px-5">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-4 py-4 text-base font-semibold text-blue-600"
            >
              <Users2 className="h-5 w-5" />
              Patients
            </button>
          </nav>

          <div className="mt-auto border-t border-border/70 p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-semibold text-slate-700">
                DR
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Dr. Richardson</p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Investigator
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section>
          <header className="border-b border-border/70 bg-white/60 px-8 py-7 backdrop-blur-sm lg:px-10">
            <nav className="flex items-center gap-3 text-lg text-slate-400">
              {PATIENT_BREADCRUMBS.map((crumb, index) => (
                <div key={crumb.label} className="flex items-center gap-3">
                  <span className={index === PATIENT_BREADCRUMBS.length - 1 ? "text-slate-700" : ""}>
                    {crumb.label}
                  </span>
                  {index < PATIENT_BREADCRUMBS.length - 1 && <span>›</span>}
                </div>
              ))}
            </nav>
          </header>

          <main className="px-6 py-9 lg:px-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl space-y-4">
                <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
                  Patient Selection
                </h1>
                <p className="max-w-2xl text-2xl leading-relaxed text-slate-500">
                  Select a trial participant or initiate a new clinical intake
                  session. Managed with ambient clinical intelligence.
                </p>
              </div>

              <Button className="h-14 rounded-full px-9 text-lg font-semibold shadow-sm">
                Create New Patient
              </Button>
            </div>

            <div className="mt-8 space-y-6 lg:mt-10">
              <div className="relative">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={onQueryChange}
                  placeholder="Search patients by name, ID, or status..."
                  className="h-16 rounded-3xl border-border/80 bg-white px-14 text-lg placeholder:text-slate-400"
                />
              </div>

              <PatientSelectionTable
                patients={patients}
                visibleCountLabel={visibleCountLabel}
              />
            </div>
          </main>
        </section>
      </div>
    </div>
  )
}
