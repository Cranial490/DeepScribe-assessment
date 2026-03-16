import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, FileText, Sparkles, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildApiUrl } from "@/lib/api"

interface VisitDetailScreenProps {
  patientId: string | null
  consultationId: string | null
  onBackToVisits: () => void
}

interface AdditionalRelevantFact {
  category: string | null
  fact: string | null
  source_text: string | null
}

interface ExtractedData {
  patient: {
    age: number | null
    sex: string | null
    location: {
      city: string | null
      state: string | null
      country: string | null
    }
  }
  clinical: {
    primary_diagnosis: string | null
    disease_stage: string | null
    biomarkers: string[]
    prior_treatments: string[]
  }
  trial_search: {
    conditions: string[]
    keywords: string[]
    location_terms: string[]
  }
  additional_relevant_facts: AdditionalRelevantFact[]
}

interface ApiConsultationRecord {
  consultation_id: string
  raw_transcript: string
  status?: "processing" | "completed" | "failed"
  llm_extracted?: ExtractedData | null
}

/**
 * Consultation detail route showing transcript and editable extracted fields.
 */
export function VisitDetailScreen({
  patientId,
  consultationId,
  onBackToVisits,
}: VisitDetailScreenProps) {
  const breadcrumbItems = ["Clinical Trials", "Patient Selection", "Visits", "Details"]
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [consultationStatus, setConsultationStatus] = useState<string | null>(null)
  const [transcriptText, setTranscriptText] = useState("")
  const [extracted, setExtracted] = useState<ExtractedData>(createEmptyExtracted())

  const parsedPatientId = useMemo(() => {
    if (!patientId) {
      return null
    }
    const parsed = Number.parseInt(patientId, 10)
    return Number.isNaN(parsed) ? null : parsed
  }, [patientId])

  useEffect(() => {
    if (parsedPatientId === null || !consultationId) {
      setErrorMessage("Missing or invalid patient/consultation identifiers.")
      return
    }

    const controller = new AbortController()

    async function loadConsultation() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const response = await fetch(buildApiUrl(`/patient/${parsedPatientId}/consultations`), {
          method: "GET",
          headers: { accept: "application/json" },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch consultation details: ${response.status}`)
        }

        const consultations = (await response.json()) as ApiConsultationRecord[]
        const selected = consultations.find(
          (consultation) => consultation.consultation_id === consultationId,
        )

        if (!selected) {
          throw new Error(`Consultation '${consultationId}' not found for patient '${parsedPatientId}'.`)
        }

        setConsultationStatus(selected.status ?? "processing")
        setTranscriptText(selected.raw_transcript ?? "")
        setExtracted(normalizeExtracted(selected.llm_extracted))
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        if (error instanceof Error) {
          setErrorMessage(error.message)
          return
        }
        setErrorMessage("Unable to load consultation details.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadConsultation()

    return () => {
      controller.abort()
    }
  }, [consultationId, parsedPatientId])

  const transcriptWordCount = transcriptText.trim().length === 0
    ? 0
    : transcriptText.trim().split(/\s+/).length

  const setArrayField = (
    section: "clinical" | "trial_search",
    key: "biomarkers" | "prior_treatments" | "conditions" | "keywords" | "location_terms",
    value: string,
  ) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    setExtracted((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: items,
      },
    }))
  }

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
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                      {consultationStatus ?? "unknown"}
                    </span>
                  </div>

                  {consultationStatus !== "completed" ? (
                    <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      Extraction is currently {consultationStatus ?? "processing"}. Editable fields may be incomplete.
                    </p>
                  ) : null}

                  <div className="mt-6 max-h-[calc(100vh-290px)] space-y-6 overflow-auto pr-1">
                    <section className="space-y-3">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Patient
                      </h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Age"
                          value={extracted.patient.age?.toString() ?? ""}
                          onChange={(value) =>
                            setExtracted((current) => ({
                              ...current,
                              patient: {
                                ...current.patient,
                                age: value.trim().length === 0 ? null : Number(value),
                              },
                            }))
                          }
                        />
                        <Field
                          label="Sex"
                          value={extracted.patient.sex ?? ""}
                          onChange={(value) =>
                            setExtracted((current) => ({
                              ...current,
                              patient: { ...current.patient, sex: value || null },
                            }))
                          }
                        />
                        <Field
                          label="City"
                          value={extracted.patient.location.city ?? ""}
                          onChange={(value) =>
                            setExtracted((current) => ({
                              ...current,
                              patient: {
                                ...current.patient,
                                location: { ...current.patient.location, city: value || null },
                              },
                            }))
                          }
                        />
                        <Field
                          label="State"
                          value={extracted.patient.location.state ?? ""}
                          onChange={(value) =>
                            setExtracted((current) => ({
                              ...current,
                              patient: {
                                ...current.patient,
                                location: { ...current.patient.location, state: value || null },
                              },
                            }))
                          }
                        />
                        <Field
                          label="Country"
                          value={extracted.patient.location.country ?? ""}
                          onChange={(value) =>
                            setExtracted((current) => ({
                              ...current,
                              patient: {
                                ...current.patient,
                                location: { ...current.patient.location, country: value || null },
                              },
                            }))
                          }
                        />
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Clinical
                      </h2>
                      <Field
                        label="Primary Diagnosis"
                        value={extracted.clinical.primary_diagnosis ?? ""}
                        onChange={(value) =>
                          setExtracted((current) => ({
                            ...current,
                            clinical: { ...current.clinical, primary_diagnosis: value || null },
                          }))
                        }
                      />
                      <Field
                        label="Disease Stage"
                        value={extracted.clinical.disease_stage ?? ""}
                        onChange={(value) =>
                          setExtracted((current) => ({
                            ...current,
                            clinical: { ...current.clinical, disease_stage: value || null },
                          }))
                        }
                      />
                      <Field
                        label="Biomarkers (comma separated)"
                        value={extracted.clinical.biomarkers.join(", ")}
                        onChange={(value) => setArrayField("clinical", "biomarkers", value)}
                      />
                      <Field
                        label="Prior Treatments (comma separated)"
                        value={extracted.clinical.prior_treatments.join(", ")}
                        onChange={(value) => setArrayField("clinical", "prior_treatments", value)}
                      />
                    </section>

                    <section className="space-y-3">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Trial Search
                      </h2>
                      <Field
                        label="Conditions (comma separated)"
                        value={extracted.trial_search.conditions.join(", ")}
                        onChange={(value) => setArrayField("trial_search", "conditions", value)}
                      />
                      <Field
                        label="Keywords (comma separated)"
                        value={extracted.trial_search.keywords.join(", ")}
                        onChange={(value) => setArrayField("trial_search", "keywords", value)}
                      />
                      <Field
                        label="Location Terms (comma separated)"
                        value={extracted.trial_search.location_terms.join(", ")}
                        onChange={(value) => setArrayField("trial_search", "location_terms", value)}
                      />
                    </section>

                    <section className="space-y-3">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Additional Relevant Facts
                      </h2>
                      {extracted.additional_relevant_facts.length === 0 ? (
                        <p className="rounded-lg border border-border/70 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                          No additional facts extracted.
                        </p>
                      ) : (
                        extracted.additional_relevant_facts.map((fact, index) => (
                          <div key={index} className="space-y-2 rounded-lg border border-border/70 bg-slate-50/70 p-3">
                            <Field
                              label="Category"
                              value={fact.category ?? ""}
                              onChange={(value) =>
                                setExtracted((current) => ({
                                  ...current,
                                  additional_relevant_facts: current.additional_relevant_facts.map(
                                    (item, itemIndex) =>
                                      itemIndex === index ? { ...item, category: value || null } : item,
                                  ),
                                }))
                              }
                            />
                            <Field
                              label="Fact"
                              value={fact.fact ?? ""}
                              onChange={(value) =>
                                setExtracted((current) => ({
                                  ...current,
                                  additional_relevant_facts: current.additional_relevant_facts.map(
                                    (item, itemIndex) =>
                                      itemIndex === index ? { ...item, fact: value || null } : item,
                                  ),
                                }))
                              }
                            />
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                Source Text
                              </label>
                              <textarea
                                value={fact.source_text ?? ""}
                                onChange={(event) =>
                                  setExtracted((current) => ({
                                    ...current,
                                    additional_relevant_facts: current.additional_relevant_facts.map(
                                      (item, itemIndex) =>
                                        itemIndex === index
                                          ? { ...item, source_text: event.target.value || null }
                                          : item,
                                    ),
                                  }))
                                }
                                className="min-h-[90px] w-full rounded-lg border border-border/80 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </section>
                  </div>
                </article>
              </section>
            </div>
          </main>
        </section>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400"
      />
    </div>
  )
}

function createEmptyExtracted(): ExtractedData {
  return {
    patient: {
      age: null,
      sex: null,
      location: {
        city: null,
        state: null,
        country: null,
      },
    },
    clinical: {
      primary_diagnosis: null,
      disease_stage: null,
      biomarkers: [],
      prior_treatments: [],
    },
    trial_search: {
      conditions: [],
      keywords: [],
      location_terms: [],
    },
    additional_relevant_facts: [],
  }
}

function normalizeExtracted(raw: ExtractedData | null | undefined): ExtractedData {
  if (!raw) {
    return createEmptyExtracted()
  }

  return {
    patient: {
      age: raw.patient?.age ?? null,
      sex: raw.patient?.sex ?? null,
      location: {
        city: raw.patient?.location?.city ?? null,
        state: raw.patient?.location?.state ?? null,
        country: raw.patient?.location?.country ?? null,
      },
    },
    clinical: {
      primary_diagnosis: raw.clinical?.primary_diagnosis ?? null,
      disease_stage: raw.clinical?.disease_stage ?? null,
      biomarkers: raw.clinical?.biomarkers ?? [],
      prior_treatments: raw.clinical?.prior_treatments ?? [],
    },
    trial_search: {
      conditions: raw.trial_search?.conditions ?? [],
      keywords: raw.trial_search?.keywords ?? [],
      location_terms: raw.trial_search?.location_terms ?? [],
    },
    additional_relevant_facts: raw.additional_relevant_facts ?? [],
  }
}
