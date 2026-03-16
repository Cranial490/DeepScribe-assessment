import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PatientRecord } from "@/features/patient-selection/model/types"

interface PatientSelectionTableProps {
  patients: ReadonlyArray<PatientRecord>
  visibleCountLabel: string
  isLoading: boolean
  onSelectPatient: (patientId: string) => void
}

/**
 * Renders the patient roster table used on the trial selection screen.
 */
export function PatientSelectionTable({
  patients,
  visibleCountLabel,
  isLoading,
  onSelectPatient,
}: PatientSelectionTableProps) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-sm">
      <header className="grid grid-cols-12 border-b border-border/70 px-8 py-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="col-span-5">Patient Name</span>
        <span className="col-span-3">Patient ID</span>
        <span className="col-span-4">Last Visit</span>
      </header>

      <div className="divide-y divide-border/70">
        {isLoading ? (
          <article className="px-8 py-10 text-base text-muted-foreground">
            Loading patients...
          </article>
        ) : null}

        {!isLoading && patients.length === 0 ? (
          <article className="px-8 py-10 text-base text-muted-foreground">
            No patients found for this search.
          </article>
        ) : null}

        {!isLoading
          ? patients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                className="grid w-full grid-cols-12 items-center px-8 py-6 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                onClick={() => onSelectPatient(patient.patientId)}
              >
                <div className="col-span-5 flex items-center gap-4">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-[13px] font-bold text-blue-600">
                    {patient.initials}
                  </div>
                  <span className="text-base font-semibold text-foreground">
                    {patient.name}
                  </span>
                </div>
                <span className="col-span-3 text-base text-slate-500">
                  {patient.patientId}
                </span>
                <span className="col-span-4 text-base text-slate-500">
                  {patient.lastVisitLabel}
                </span>
              </button>
            ))
          : null}
      </div>

      <footer className="flex items-center justify-between border-t border-border/70 px-8 py-7 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>{visibleCountLabel}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-full border border-border/70 text-slate-400 transition-colors hover:bg-muted"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-full border border-border/70 text-slate-500 transition-colors hover:bg-muted"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </section>
  )
}
