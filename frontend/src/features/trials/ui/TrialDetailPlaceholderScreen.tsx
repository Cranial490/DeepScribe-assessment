import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchClinicalTrialDetail } from "@/lib/clinicalTrials"
import { AppShell } from "@/app/AppShell"

interface TrialDetailPlaceholderScreenProps {
  nctId: string | null
  onBack: () => void
}

export function TrialDetailPlaceholderScreen({ nctId, onBack }: TrialDetailPlaceholderScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [studyPayload, setStudyPayload] = useState<unknown>(null)

  useEffect(() => {
    const normalizedNctId = nctId?.trim() ?? ""
    if (!normalizedNctId) {
      setErrorMessage("Missing NCT ID in route.")
      return
    }

    const controller = new AbortController()

    async function loadStudy() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const payload = await fetchClinicalTrialDetail(normalizedNctId, controller.signal)
        setStudyPayload(payload)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        if (error instanceof Error) {
          setErrorMessage(error.message)
          return
        }
        setErrorMessage("Unable to load trial details.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadStudy()

    return () => {
      controller.abort()
    }
  }, [nctId])

  return (
    <AppShell>
      <section>
          <header className="border-b border-border/70 bg-white/60 px-8 py-7 backdrop-blur-sm lg:px-10">
            <nav className="flex items-center gap-3 text-lg text-slate-400">
              <span>Clinical Trials</span>
              <span>›</span>
              <span>Trial</span>
              <span>›</span>
              <span className="text-slate-700">{nctId ?? "Unknown"}</span>
            </nav>
          </header>

          <main className="px-6 py-9 lg:px-10">
            <div className="mx-auto w-full max-w-5xl space-y-8">
              <Button variant="outline" className="gap-2" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <section className="rounded-2xl border border-border/70 bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Trial
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
                  {nctId ?? "Unknown Trial"}
                </h1>

                <div className="mt-6">
                  {isLoading ? (
                    <p className="rounded-xl border border-border/70 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Loading trial details...
                    </p>
                  ) : null}
                  {errorMessage ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errorMessage}
                    </p>
                  ) : null}
                  {!isLoading && !errorMessage ? <JsonTree value={studyPayload} /> : null}
                </div>
              </section>
            </div>
          </main>
      </section>
    </AppShell>
  )
}

function JsonTree({ value }: { value: unknown }) {
  if (value === null) {
    return (
      <p className="rounded-xl border border-border/70 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No trial payload returned.
      </p>
    )
  }

  const rows = flattenJson(value)

  return (
    <div className="overflow-auto rounded-xl border border-border/70 bg-white">
      <table className="min-w-full table-auto text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Field</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.path}-${index}`} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.path}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{row.type}</td>
              <td className="px-4 py-3 text-xs text-slate-800">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface JsonRow {
  path: string
  type: string
  value: string
}

function flattenJson(value: unknown, path = "study"): JsonRow[] {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [{ path, type: "array", value: "[]" }]
    }

    return value.flatMap((item, index) => flattenJson(item, `${path}[${index}]`))
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return [{ path, type: "object", value: "{}" }]
    }

    return entries.flatMap(([key, child]) => flattenJson(child, `${path}.${key}`))
  }

  return [
    {
      path,
      type: getValueType(value),
      value: formatValue(value),
    },
  ]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getValueType(value: unknown): string {
  if (value === null) {
    return "null"
  }
  return typeof value
}

function formatValue(value: unknown): string {
  if (value === null) {
    return "null"
  }
  if (typeof value === "string") {
    return value
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return JSON.stringify(value)
}
