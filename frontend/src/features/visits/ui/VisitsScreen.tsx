import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { buildApiUrl } from "@/lib/api"
import { AppShell } from "@/app/AppShell"

interface VisitsScreenProps {
  patientId: string | null
  onBackToPatients: () => void
  onUploadTranscript: () => void
  onOpenConsultation: (consultationId: string) => void
  onShowMatchingTrials: (consultationId: string) => void
}

interface ApiConsultation {
  consultation_id: string
  created_at: string | null
  status?: "processing" | "completed" | "failed"
}

type VisitStatus = "queued" | "processing" | "completed" | "failed"

interface VisitRow {
  consultationId: string
  createdAt: string
  visitDateLabel: string
  visitTimeLabel: string
  visitType: "Consultation"
  status: VisitStatus
}

/**
 * Visits route destination for a selected patient.
 */
export function VisitsScreen({
  patientId,
  onBackToPatients,
  onUploadTranscript,
  onOpenConsultation,
  onShowMatchingTrials,
}: VisitsScreenProps) {
  const breadcrumbItems = ["Clinical Trials", "Patient Selection", "Visits"]
  const [query, setQuery] = useState("")
  const [visits, setVisits] = useState<ReadonlyArray<VisitRow>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId) {
      setVisits([])
      return
    }

    const controller = new AbortController()

    async function loadConsultations() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const response = await fetch(buildApiUrl(`/patient/${patientId}/consultations`), {
          method: "GET",
          headers: { accept: "application/json" },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch consultations: ${response.status}`)
        }

        const payload = (await response.json()) as Array<ApiConsultation>
        setVisits(payload.map(mapApiConsultationToVisitRow))
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        setErrorMessage("Unable to load consultations.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadConsultations()

    return () => {
      controller.abort()
    }
  }, [patientId])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredVisits =
    normalizedQuery.length === 0
      ? visits
      : visits.filter((visit) =>
          `${visit.createdAt} ${visit.consultationId} ${visit.status}`
            .toLowerCase()
            .includes(normalizedQuery),
        )

  return (
    <AppShell>
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
            <div className="mx-auto w-full max-w-5xl space-y-8">
              <Button variant="outline" className="gap-2" onClick={onBackToPatients}>
                <ArrowLeft className="h-4 w-4" />
                Back to Patient Selection
              </Button>
              <div className="flex justify-end">
                <Button onClick={onUploadTranscript}>Upload Transcript</Button>
              </div>

              <section className="rounded-2xl border border-border/70 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Visits
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
                  Patient Visits
                </h1>
                <p className="mt-4 text-lg text-slate-600">
                  {patientId
                    ? `Visit history for patient ID ${patientId}.`
                    : "No patient ID provided in route."}
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-end">
                    <div className="relative w-full max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search visits..."
                        className="h-11 w-full rounded-xl border border-border/80 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-border/70">
                    <div className="grid grid-cols-12 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                      <span className="col-span-3">Visit Date</span>
                      <span className="col-span-3">Visit Type</span>
                      <span className="col-span-3">Status</span>
                      <span className="col-span-3 text-right">Actions</span>
                    </div>

                    <div className="divide-y divide-border/70 bg-white">
                      {isLoading ? (
                        <p className="px-5 py-6 text-sm text-slate-500">Loading consultations...</p>
                      ) : null}
                      {errorMessage ? (
                        <p className="px-5 py-6 text-sm text-red-600">{errorMessage}</p>
                      ) : null}
                      {!isLoading && !errorMessage && filteredVisits.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-slate-500">No consultations found.</p>
                      ) : null}

                      {!isLoading && !errorMessage
                        ? filteredVisits.map((visit) => (
                            <article
                              key={visit.consultationId}
                              role="button"
                              tabIndex={0}
                              onClick={() => onOpenConsultation(visit.consultationId)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault()
                                  onOpenConsultation(visit.consultationId)
                                }
                              }}
                              className="grid cursor-pointer grid-cols-12 items-center px-5 py-5 transition-colors hover:bg-slate-50"
                            >
                              <div className="col-span-3">
                                <p className="text-base font-semibold text-slate-800">{visit.visitDateLabel}</p>
                                <p className="mt-1 text-xs text-slate-500">{visit.visitTimeLabel}</p>
                              </div>
                              <p className="col-span-3 text-base text-slate-700">{visit.visitType}</p>
                              <div className="col-span-3">
                                <span className={statusClassName(visit.status)}>
                                  {statusLabel(visit.status)}
                                </span>
                              </div>
                              <div className="col-span-3 text-right">
                                  <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    onShowMatchingTrials(visit.consultationId)
                                  }}
                                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  Show matching trials <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </article>
                          ))
                        : null}
                    </div>

                    <footer className="flex items-center justify-between border-t border-border/70 bg-slate-50 px-5 py-4">
                      <p className="text-sm text-slate-500">
                        Showing {filteredVisits.length} of {visits.length} visits
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-md border border-border/70 text-slate-400"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-md border border-border/70 text-slate-500"
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </footer>
                  </div>
                </div>
              </section>
            </div>
          </main>
      </section>
    </AppShell>
  )
}

function mapApiConsultationToVisitRow(consultation: ApiConsultation): VisitRow {
  const createdDate = consultation.created_at ? new Date(consultation.created_at) : null
  return {
    consultationId: consultation.consultation_id,
    createdAt: consultation.created_at ?? "",
    visitDateLabel: createdDate ? formatVisitDate(createdDate) : "Unknown date",
    visitTimeLabel: createdDate ? formatVisitTime(createdDate) : "--:--",
    visitType: "Consultation",
    status: mapStatus(consultation.status),
  }
}

function mapStatus(
  rawStatus: "processing" | "completed" | "failed" | undefined,
): VisitStatus {
  if (rawStatus === "processing") {
    return "processing"
  }
  if (rawStatus === "completed") {
    return "completed"
  }
  if (rawStatus === "failed") {
    return "failed"
  }
  return "queued"
}

function formatVisitDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(value)
}

function formatVisitTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(value)
}

function statusLabel(status: VisitStatus): string {
  if (status === "processing") {
    return "Processing"
  }
  if (status === "completed") {
    return "Completed"
  }
  if (status === "failed") {
    return "Failed"
  }
  return "Queued"
}

function statusClassName(status: VisitStatus): string {
  if (status === "processing") {
    return "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
  }
  if (status === "completed") {
    return "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
  }
  if (status === "failed") {
    return "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
  }
  return "inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
}
