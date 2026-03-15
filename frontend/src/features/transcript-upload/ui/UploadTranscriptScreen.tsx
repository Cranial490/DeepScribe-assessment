import { ArrowLeft, FileUp, ShieldCheck, Sparkles, Users2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UploadTranscriptScreenProps {
  patientId: string | null
  onBackToVisits: () => void
}

type UploadMode = "file" | "paste"

/**
 * Upload transcript page with mutually exclusive file upload and paste modes.
 */
export function UploadTranscriptScreen({
  patientId,
  onBackToVisits,
}: UploadTranscriptScreenProps) {
  const [mode, setMode] = useState<UploadMode>("file")
  const [file, setFile] = useState<File | null>(null)
  const [rawTranscript, setRawTranscript] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
      setSuccessMessage(null)

      const formData = new FormData()
      formData.append("patient_id", patientId)
      if (mode === "file" && file) {
        formData.append("transcript_file", file)
      } else {
        formData.append("raw_transcript", rawTranscript)
      }

      const response = await fetch("/transcript/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const message = await extractApiError(response)
        setErrorMessage(message)
        return
      }

      const payload = (await response.json()) as { consultation_id: string }
      setSuccessMessage(`Uploaded successfully. Consultation ID: ${payload.consultation_id}`)

      // Return to visits so the newly created consultation appears in the list.
      onBackToVisits()
    } catch {
      setErrorMessage("Unable to upload transcript.")
    } finally {
      setIsSubmitting(false)
    }
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
                      onClick={() => setMode("file")}
                      className={`px-4 py-4 text-center text-lg font-semibold ${
                        mode === "file"
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-slate-500"
                      }`}
                    >
                      Upload File
                    </button>
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
                  </div>

                  <div className="p-8">
                    {mode === "file" ? (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
                        <div className="mx-auto grid h-18 w-18 place-items-center rounded-full bg-blue-50">
                          <FileUp className="h-7 w-7 text-blue-600" />
                        </div>
                        <p className="mt-5 text-3xl font-semibold text-slate-800">
                          Upload transcript file
                        </p>
                        <p className="mt-2 text-lg text-slate-500">Only .txt files are supported</p>

                        <div className="mx-auto mt-6 max-w-md space-y-3">
                          <Input
                            type="file"
                            accept=".txt,text/plain"
                            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                          />
                          {file ? (
                            <p className="text-sm text-slate-600">Selected: {file.name}</p>
                          ) : null}
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
                {successMessage ? (
                  <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {successMessage}
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
      </div>
    </div>
  )
}

async function extractApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>
    }
    if (typeof payload.detail === "string") {
      return payload.detail
    }
    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const firstMessage = payload.detail[0]?.msg
      if (firstMessage) {
        return firstMessage
      }
    }
  } catch {
    return `Unable to upload transcript (HTTP ${response.status}).`
  }

  return `Unable to upload transcript (HTTP ${response.status}).`
}
