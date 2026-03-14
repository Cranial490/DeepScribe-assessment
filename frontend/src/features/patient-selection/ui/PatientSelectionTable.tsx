import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PatientRecord } from "@/features/patient-selection/model/types"
import { PatientStatusBadge } from "@/features/patient-selection/ui/PatientStatusBadge"

interface PatientSelectionTableProps {
  patients: ReadonlyArray<PatientRecord>
  visibleCountLabel: string
}

/**
 * Renders the patient roster table used on the trial selection screen.
 */
export function PatientSelectionTable({
  patients,
  visibleCountLabel,
}: PatientSelectionTableProps) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-sm">
      <header className="grid grid-cols-12 border-b border-border/70 px-8 py-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="col-span-4">Patient Name</span>
        <span className="col-span-2">Trial ID</span>
        <span className="col-span-3">Status</span>
        <span className="col-span-3">Last Visit</span>
      </header>

      <div className="divide-y divide-border/70">
        {patients.map((patient) => (
          <article key={patient.id} className="grid grid-cols-12 items-center px-8 py-6">
            <div className="col-span-4 flex items-center gap-4">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-[13px] font-bold text-blue-600">
                {patient.initials}
              </div>
              <span className="text-base font-semibold text-foreground">
                {patient.name}
              </span>
            </div>
            <span className="col-span-2 text-base text-slate-500">{patient.trialId}</span>
            <div className="col-span-3">
              <PatientStatusBadge status={patient.status} />
            </div>
            <span className="col-span-3 text-base text-slate-500">
              {patient.lastVisitLabel}
            </span>
          </article>
        ))}
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
