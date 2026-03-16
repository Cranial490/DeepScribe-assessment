import { useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { buildApiUrl } from "@/lib/api"
import { parseApiError } from "@/shared/utils/apiErrors"
import type { ExtractedData } from "@/shared/types/clinical"
import {
  applyListDraftsToExtracted,
  buildListDrafts,
  createEmptyExtracted,
  type ListDrafts,
  normalizeExtracted,
} from "@/features/visits/model/extracted"

interface ApiConsultationRecord {
  consultation_id: string
  raw_transcript: string
  status?: "processing" | "completed" | "failed"
  llm_extracted?: ExtractedData | null
}

interface UseVisitDetailEditorParams {
  patientId: string | null
  consultationId: string | null
}

export interface UseVisitDetailEditorResult {
  isLoading: boolean
  errorMessage: string | null
  saveError: string | null
  saveMessage: string | null
  isSaving: boolean
  consultationStatus: string | null
  transcriptText: string
  transcriptWordCount: number
  extracted: ExtractedData
  listDrafts: ListDrafts
  isDirty: boolean
  setExtracted: Dispatch<SetStateAction<ExtractedData>>
  setListDrafts: Dispatch<SetStateAction<ListDrafts>>
  onSave: () => Promise<void>
}

export function useVisitDetailEditor({
  patientId,
  consultationId,
}: UseVisitDetailEditorParams): UseVisitDetailEditorResult {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [consultationStatus, setConsultationStatus] = useState<string | null>(null)
  const [transcriptText, setTranscriptText] = useState("")
  const [extracted, setExtracted] = useState<ExtractedData>(createEmptyExtracted())
  const [initialExtracted, setInitialExtracted] = useState<ExtractedData>(createEmptyExtracted())
  const [listDrafts, setListDrafts] = useState<ListDrafts>(buildListDrafts(createEmptyExtracted()))

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
        const normalizedExtracted = normalizeExtracted(selected.llm_extracted)
        setExtracted(normalizedExtracted)
        setInitialExtracted(normalizedExtracted)
        setListDrafts(buildListDrafts(normalizedExtracted))
        setSaveError(null)
        setSaveMessage(null)
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

  const transcriptWordCount =
    transcriptText.trim().length === 0 ? 0 : transcriptText.trim().split(/\s+/).length
  const extractedWithDrafts = applyListDraftsToExtracted(extracted, listDrafts)
  const isDirty =
    JSON.stringify(normalizeExtracted(extractedWithDrafts)) !==
    JSON.stringify(normalizeExtracted(initialExtracted))

  const onSave = async () => {
    if (parsedPatientId === null || !consultationId) {
      setSaveError("Missing or invalid patient/consultation identifiers.")
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveMessage(null)

      const response = await fetch(buildApiUrl("/transcript/edit"), {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: parsedPatientId,
          consultation_id: consultationId,
          llm_extracted: normalizeExtracted(extractedWithDrafts),
        }),
      })

      if (!response.ok) {
        const apiError = await parseApiError(
          response,
          `Unable to update extracted fields (HTTP ${response.status}).`,
        )
        setSaveError(apiError)
        return
      }

      const payload = (await response.json()) as {
        llm_extracted?: ExtractedData
      }
      const normalized = normalizeExtracted(payload.llm_extracted)
      setExtracted(normalized)
      setInitialExtracted(normalized)
      setListDrafts(buildListDrafts(normalized))
      setSaveMessage("Extracted fields updated successfully.")
    } catch {
      setSaveError("Unable to update extracted fields.")
    } finally {
      setIsSaving(false)
    }
  }

  return {
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
  }
}
