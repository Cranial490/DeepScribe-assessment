import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildApiUrl } from "@/lib/api"
import { fetchClinicalTrials } from "@/lib/clinicalTrials"
import { AppShell } from "@/app/AppShell"
import { parseApiError } from "@/shared/utils/apiErrors"
import { PageHeader } from "@/shared/ui/PageHeader"
import type { ClinicalTrialStudy, TrialSearchInput } from "@/shared/types/clinical"

interface TrialsPlaceholderScreenProps {
  patientId: string | null
  consultationId: string | null
  onBackToVisits: () => void
  onOpenTrial: (nctId: string) => void
}

interface ExtractedTrialSearchResponse {
  status?: "processing" | "failed" | "completed"
  trial_search?: Partial<TrialSearchInput>
}

export function TrialsPlaceholderScreen({
  patientId,
  consultationId,
  onBackToVisits,
  onOpenTrial,
}: TrialsPlaceholderScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [trials, setTrials] = useState<ClinicalTrialStudy[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [trialSearch, setTrialSearch] = useState<TrialSearchInput | null>(null)

  const parsedPatientId = useMemo(() => {
    if (!patientId) {
      return null
    }
    const parsed = Number.parseInt(patientId, 10)
    return Number.isNaN(parsed) ? null : parsed
  }, [patientId])

  const loadTrials = useCallback(
    async (
      searchPayload: TrialSearchInput,
      pageToken?: string,
      append = false,
      signal?: AbortSignal,
    ) => {
      if (parsedPatientId === null || !consultationId) {
        setErrorMessage("Missing or invalid patient/consultation identifiers.")
        return
      }

      try {
        if (append) {
          setIsLoadingMore(true)
        } else {
          setIsLoading(true)
          setErrorMessage(null)
        }

        const payload = await fetchClinicalTrials(searchPayload, pageToken, signal)
        const nextStudies = payload.studies ?? []
        setTrials((current) => (append ? [...(current ?? []), ...nextStudies] : nextStudies))
        setNextPageToken(payload.nextPageToken ?? null)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        if (error instanceof Error) {
          setErrorMessage(error.message)
          return
        }
        setErrorMessage("Unable to load matching trials.")
      } finally {
        if (append) {
          setIsLoadingMore(false)
        } else {
          setIsLoading(false)
        }
      }
    },
    [consultationId, parsedPatientId],
  )

  useEffect(() => {
    if (parsedPatientId === null || !consultationId) {
      setErrorMessage("Missing or invalid patient/consultation identifiers.")
      return
    }

    const controller = new AbortController()
    async function loadExtractedAndTrials() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        setTrials([])
        setNextPageToken(null)

        const extractedResponse = await fetch(
          buildApiUrl(`/patient/${parsedPatientId}/consultations/${consultationId}/extracted`),
          {
            method: "GET",
            signal: controller.signal,
          },
        )

        if (!extractedResponse.ok) {
          throw new Error(
            await parseApiError(
              extractedResponse,
              `Unable to load matching trials (HTTP ${extractedResponse.status}).`,
            ),
          )
        }

        const extractedPayload = (await extractedResponse.json()) as ExtractedTrialSearchResponse
        if (extractedPayload.status && extractedPayload.status !== "completed") {
          throw new Error(
            extractedPayload.status === "processing"
              ? "Extraction is still processing. Try again in a moment."
              : "Extraction failed for this consultation. Please re-run extraction.",
          )
        }

        const resolvedTrialSearch: TrialSearchInput = {
          conditions: extractedPayload.trial_search?.conditions ?? [],
          interventions: extractedPayload.trial_search?.interventions ?? [],
          biomarker_and_molecular_terms:
            extractedPayload.trial_search?.biomarker_and_molecular_terms ?? [],
          preferred_locations: extractedPayload.trial_search?.preferred_locations ?? [],
          sex: extractedPayload.trial_search?.sex ?? "All",
          age_groups: extractedPayload.trial_search?.age_groups ?? [],
        }
        setTrialSearch(resolvedTrialSearch)
        await loadTrials(resolvedTrialSearch, undefined, false, controller.signal)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        if (error instanceof Error) {
          setErrorMessage(error.message)
          return
        }
        setErrorMessage("Unable to load matching trials.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadExtractedAndTrials()

    return () => {
      controller.abort()
    }
  }, [consultationId, loadTrials, parsedPatientId])

  const onLoadMore = () => {
    if (!nextPageToken || isLoading || isLoadingMore || !trialSearch) {
      return
    }
    setErrorMessage(null)
    void loadTrials(trialSearch, nextPageToken, true)
  }

  return (
    <AppShell>
      <section>
          <PageHeader breadcrumbs={["Clinical Trials", "Matching Trials"]} />

          <main className="px-6 py-9 lg:px-10">
            <div className="mx-auto w-full max-w-5xl space-y-8">
              <Button variant="outline" className="gap-2" onClick={onBackToVisits}>
                <ArrowLeft className="h-4 w-4" />
                Back to Visits
              </Button>

              <section className="rounded-2xl border border-border/70 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Trials
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
                  Matching Trials
                </h1>
                <p className="mt-4 text-base text-slate-600">
                  Patient ID {patientId ?? "-"} • Consultation ID {consultationId ?? "-"}
                </p>

                <div className="mt-8 space-y-4">
                  {isLoading ? (
                    <p className="rounded-xl border border-border/70 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Loading matching trials...
                    </p>
                  ) : null}
                  {errorMessage ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errorMessage}
                    </p>
                  ) : null}
                  {!isLoading && !errorMessage && trials && trials.length === 0 ? (
                    <p className="rounded-xl border border-border/70 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      No matching trials found.
                    </p>
                  ) : null}
                  {!isLoading && !errorMessage && trials
                    ? trials.map((study, index) => {
                        const id = study.protocolSection?.identificationModule?.nctId ?? "N/A"
                        const title =
                          study.protocolSection?.identificationModule?.briefTitle ??
                          "Untitled study"
                        const summary =
                          study.protocolSection?.descriptionModule?.briefSummary ??
                          "No summary available."
                        const phases = study.protocolSection?.designModule?.phases ?? []

                        return (
                          <article
                            key={`${id}-${index}`}
                            className="rounded-xl border border-border/70 bg-white p-5"
                          >
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={() => {
                                if (id !== "N/A") {
                                  onOpenTrial(id)
                                }
                              }}
                              disabled={id === "N/A"}
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                {id}
                              </p>
                              <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
                              <p className="mt-3 text-sm leading-6 text-slate-600">{summary}</p>
                              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                Phase: {phases.length > 0 ? phases.join(", ") : "NA"}
                              </p>
                            </button>
                          </article>
                        )
                      })
                    : null}
                  {!isLoading && !errorMessage && nextPageToken ? (
                    <div className="pt-2">
                      <Button onClick={onLoadMore} disabled={isLoadingMore}>
                        {isLoadingMore ? "Loading more..." : "Load more"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </main>
      </section>
    </AppShell>
  )
}
