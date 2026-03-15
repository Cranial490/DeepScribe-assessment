import { ArrowLeft, FileText, Sparkles, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VisitDetailScreenProps {
  patientId: string | null
  consultationId: string | null
  onBackToVisits: () => void
}

/**
 * Placeholder detail route for a selected consultation.
 */
export function VisitDetailScreen({
  patientId,
  consultationId,
  onBackToVisits,
}: VisitDetailScreenProps) {
  const breadcrumbItems = [
    "Clinical Trials",
    "Patient Selection",
    "Visits",
    "Details",
  ]

  return (
    <div className="min-h-screen bg-[#f5f7fc] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        <aside className="flex flex-col border-r border-border/70 bg-white/80 backdrop-blur-sm">
          <div className="px-8 pb-6 pt-10">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span className="text-3xl font-semibold tracking-tight">DeepScribe</span>
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
              {breadcrumbItems.map((crumb, index) => (
                <div key={crumb} className="flex items-center gap-3">
                  <span className={index === breadcrumbItems.length - 1 ? "text-slate-700" : ""}>
                    {crumb}
                  </span>
                  {index < breadcrumbItems.length - 1 && <span>›</span>}
                </div>
              ))}
            </nav>
          </header>

          <main className="px-6 py-9 lg:px-10">
            <div className="max-w-5xl space-y-8">
              <Button variant="outline" className="gap-2" onClick={onBackToVisits}>
                <ArrowLeft className="h-4 w-4" />
                Back to Visits
              </Button>

              <section className="rounded-2xl border border-border/70 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Consultation Details
                  </p>
                </div>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
                  Visit Detail Placeholder
                </h1>
                <p className="mt-4 text-lg text-slate-600">
                  Patient ID: {patientId ?? "N/A"}
                </p>
                <p className="mt-1 text-lg text-slate-600">
                  Consultation ID: {consultationId ?? "N/A"}
                </p>
              </section>
            </div>
          </main>
        </section>
      </div>
    </div>
  )
}
