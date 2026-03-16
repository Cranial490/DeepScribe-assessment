import { ArrowLeft, FileUp, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { buildApiUrl } from "@/lib/api"
import { AppShell } from "@/app/AppShell"
import { parseApiError } from "@/shared/lib/apiErrors"
import { PageHeader } from "@/shared/ui/PageHeader"

interface UploadTranscriptScreenProps {
  patientId: string | null
  onBackToVisits: () => void
}

type UploadMode = "file" | "paste"

interface UploadTranscriptResponse {
  patient_id: number
  consultation_id: string
}

/**
 * Upload transcript page with mutually exclusive file upload and paste modes.
 */
export function UploadTranscriptScreen({
  patientId,
  onBackToVisits,
}: UploadTranscriptScreenProps) {
  const [mode, setMode] = useState<UploadMode>("paste")
  const [file, setFile] = useState<File | null>(null)
  const [rawTranscript, setRawTranscript] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const breadcrumbItems = ["Clinical Trials", "Patient Selection", "Upload Transcript"]

  const onSubmit = async () => {
    if (!patientId) {
      setErrorMessage("Missing patient ID in route.")
      return
    }

    if (mode === "file") {
      if (!file) {
        setErrorMessage("Please select a .txt file.")
        return
      }
      if (!file.name.toLowerCase().endsWith(".txt")) {
        setErrorMessage("Only .txt files are allowed.")
        return
      }
    }

    if (mode === "paste" && rawTranscript.trim().length === 0) {
      setErrorMessage("Please paste transcript text.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const formData = new FormData()
      formData.append("patient_id", patientId)
      if (mode === "file" && file) {
        formData.append("transcript_file", file)
      } else {
        formData.append("raw_transcript", rawTranscript)
      }

      const response = await fetch(buildApiUrl("/transcript/upload"), {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const message = await parseApiError(
          response,
          `Unable to upload transcript (HTTP ${response.status}).`,
        )
        setErrorMessage(message)
        return
      }

      const payload = (await response.json()) as UploadTranscriptResponse

      try {
        const extractResponse = await fetch(buildApiUrl("/transcript/extract"), {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patient_id: payload.patient_id,
            consultation_id: payload.consultation_id,
          }),
        })

        if (!extractResponse.ok) {
          // Non-blocking by design: user is returned to visits even if extraction cannot be queued.
        }
      } catch {
        // Extract job submission is best-effort. Upload has already succeeded.
      }

      // Return to visits so the newly created consultation appears in the list.
      onBackToVisits()
    } catch {
      setErrorMessage("Unable to upload transcript.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell>
      <section>
          <PageHeader breadcrumbs={breadcrumbItems} />

          <main className="px-6 py-9 lg:px-10">
            <div className="mx-auto max-w-4xl space-y-8">
              <Button variant="outline" className="gap-2" onClick={onBackToVisits}>
                <ArrowLeft className="h-4 w-4" />
                Back to Visits
              </Button>

              <section className="rounded-2xl border border-border/70 bg-white p-8 shadow-sm">
                <h1 className="text-center text-5xl font-semibold tracking-tight text-slate-900">
                  New Consultation
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-center text-2xl text-slate-500">
                  Upload text transcript files or paste direct transcript text for
                  secure AI processing.
                </p>

                <div className="mt-8 overflow-hidden rounded-xl border border-border/70">
                  <div className="grid grid-cols-2 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setMode("paste")}
                      className={`px-4 py-4 text-center text-lg font-semibold ${
                        mode === "paste"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-slate-500"
                      }`}
                    >
                      Paste Transcript
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("file")}
                      className={`px-4 py-4 text-center text-lg font-semibold ${
                        mode === "file"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-slate-500"
                      }`}
                    >
                      Upload File
                    </button>
                  </div>

                  <div className="p-8">
                    {mode === "file" ? (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-blue-100 bg-blue-50">
                          <FileUp className="h-7 w-7 text-blue-600" />
                        </div>
                        <p className="mt-5 text-3xl font-semibold text-slate-800">
                          Upload transcript file
                        </p>
                        <p className="mt-2 text-lg text-slate-500">Only .txt files are supported</p>

                        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3">
                          <input
                            id="transcript-file-input"
                            type="file"
                            accept=".txt,text/plain"
                            className="sr-only"
                            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                          />
                          <label
                            htmlFor="transcript-file-input"
                            className="inline-flex h-10 cursor-pointer items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                          >
                            Choose File
                          </label>
                          <p className="text-sm text-slate-600">
                            {file ? file.name : "No file chosen"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label htmlFor="raw-transcript" className="text-sm font-medium text-slate-700">
                          Transcript text
                        </label>
                        <textarea
                          id="raw-transcript"
                          value={rawTranscript}
                          onChange={(event) => setRawTranscript(event.target.value)}
                          placeholder="Paste transcript here..."
                          className="min-h-[260px] w-full rounded-xl border border-border/70 p-4 text-base outline-none transition-colors focus:border-blue-400"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {errorMessage ? (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="mt-6 flex items-center justify-between">
                  <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <ShieldCheck className="h-4 w-4" />
                    HIPAA Compliant & End-to-end Encrypted
                  </p>

                  <Button onClick={() => void onSubmit()} disabled={isSubmitting}>
                    {isSubmitting ? "Uploading..." : "Upload Transcript"}
                  </Button>
                </div>
              </section>
            </div>
          </main>
      </section>
    </AppShell>
  )
}
