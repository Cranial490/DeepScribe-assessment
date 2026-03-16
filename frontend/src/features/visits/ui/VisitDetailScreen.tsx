import { ArrowLeft, ChevronRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/app/AppShell"
import { PageHeader } from "@/shared/ui/PageHeader"
import { useVisitDetailEditor } from "@/features/visits/hooks/useVisitDetailEditor"
import { VisitDetailEditorSections } from "@/features/visits/ui/VisitDetailEditorSections"

interface VisitDetailScreenProps {
  patientId: string | null
  consultationId: string | null
  onBackToVisits: () => void
  onShowMatchingTrials: () => void
}

/**
 * Consultation detail route showing transcript and editable extracted fields.
 */
export function VisitDetailScreen({
  patientId,
  consultationId,
  onBackToVisits,
  onShowMatchingTrials,
}: VisitDetailScreenProps) {
  const breadcrumbItems = ["Clinical Trials", "Patient Selection", "Visits", "Details"]
  const {
    isLoading,
    errorMessage,
    saveError,
    saveMessage,
    isSaving,
    consultationStatus,
    transcriptText,
    transcriptWordCount,
    extracted,
    listDrafts,
    isDirty,
    setExtracted,
    setListDrafts,
    onSave,
  } = useVisitDetailEditor({ patientId, consultationId })

  return (
    <AppShell>
      <section>
        <PageHeader breadcrumbs={breadcrumbItems} />

        <main className="px-6 py-9 lg:px-10">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">
            <Button variant="outline" className="gap-2" onClick={onBackToVisits}>
              <ArrowLeft className="h-4 w-4" />
              Back to Visits
            </Button>

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <article className="rounded-2xl border border-border/70 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Original Transcript
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {transcriptWordCount.toLocaleString()} words
                  </p>
                </div>
                <div className="mt-5 max-h-[calc(100vh-280px)] overflow-auto rounded-xl border border-border/70 bg-slate-50/70 p-5">
                  {isLoading ? (
                    <p className="text-sm text-slate-500">Loading transcript...</p>
                  ) : (
                    <p className="whitespace-pre-wrap text-[17px] leading-9 text-slate-700">
                      {transcriptText || "No transcript available for this consultation."}
                    </p>
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                      Extracted Structured Data
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                      Patient ID {patientId ?? "N/A"} · Consultation ID {consultationId ?? "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                      {consultationStatus ?? "unknown"}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => void onSave()}
                      disabled={isLoading || consultationStatus !== "completed" || !isDirty || isSaving}
                    >
                      {isSaving ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </div>

                <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  AI-generated content may contain errors. Please review all extracted fields and update them as
                  needed before using them for trial search or clinical decisions.
                </p>
                <button
                  type="button"
                  onClick={onShowMatchingTrials}
                  disabled={isLoading || !patientId || !consultationId}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Show matching trials <ChevronRight className="h-4 w-4" />
                </button>

                {consultationStatus !== "completed" ? (
                  <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Extraction is currently {consultationStatus ?? "processing"}. Editable fields may be incomplete.
                  </p>
                ) : null}
                {saveError ? (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {saveError}
                  </p>
                ) : null}
                {saveMessage ? (
                  <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {saveMessage}
                  </p>
                ) : null}

                <VisitDetailEditorSections
                  extracted={extracted}
                  listDrafts={listDrafts}
                  setExtracted={setExtracted}
                  setListDrafts={setListDrafts}
                />
              </article>
            </section>
          </div>
        </main>
      </section>
    </AppShell>
  )
}
