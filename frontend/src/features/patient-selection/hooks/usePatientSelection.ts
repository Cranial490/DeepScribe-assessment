import { useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import type { PatientRecord } from "@/features/patient-selection/model/types"
import { buildApiUrl } from "@/lib/api"
import { parseApiError } from "@/shared/utils/apiErrors"

interface UsePatientSelectionResult {
  query: string
  visiblePatients: ReadonlyArray<PatientRecord>
  visibleCountLabel: string
  isLoading: boolean
  isCreatingPatient: boolean
  errorMessage: string | null
  createPatientMessage: string | null
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void
  onCreatePatient: (input: CreatePatientInput) => Promise<boolean>
}

interface ApiPatient {
  id: number | string
  first_name: string
  last_name: string
  date_of_birth: string | null
  created_at: string | null
}

interface CreatePatientPayload {
  first_name: string
  last_name: string
  date_of_birth?: string | null
}

export interface CreatePatientInput {
  firstName: string
  lastName: string
  dateOfBirth: string
}

/**
 * Handles patient fetching, typed mapping, and local search filtering.
 */
export function usePatientSelection(): UsePatientSelectionResult {
  const [query, setQuery] = useState("")
  const [patients, setPatients] = useState<ReadonlyArray<PatientRecord>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createPatientMessage, setCreatePatientMessage] = useState<string | null>(null)

  async function loadPatients(signal?: AbortSignal) {
    const response = await fetch(buildApiUrl("/patient/"), {
      method: "GET",
      headers: { accept: "application/json" },
      signal,
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.status}`)
    }

    const payload = (await response.json()) as Array<ApiPatient>
    setPatients(payload.map(mapApiPatientToRecord))
  }

  useEffect(() => {
    const controller = new AbortController()

    async function fetchPatients() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        await loadPatients(controller.signal)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        setErrorMessage("Unable to load patients from API.")
      } finally {
        setIsLoading(false)
      }
    }

    void fetchPatients()

    return () => {
      controller.abort()
    }
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const visiblePatients =
    normalizedQuery.length === 0
      ? patients
      : patients.filter((patient) => {
          const searchableText = `${patient.name} ${patient.patientId}`.toLowerCase()
          return searchableText.includes(normalizedQuery)
        })

  const visibleCountLabel = `Showing ${visiblePatients.length} of ${patients.length} patients`

  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  const onCreatePatient = async (input: CreatePatientInput) => {
    const firstName = input.firstName.trim()
    const lastName = input.lastName.trim()
    const dateOfBirth = input.dateOfBirth.trim()
    if (!firstName || !lastName) {
      setCreatePatientMessage("Please enter both first and last name.")
      return false
    }

    const createPayload: CreatePatientPayload = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth.length > 0 ? dateOfBirth : null,
    }

    try {
      setIsCreatingPatient(true)
      setCreatePatientMessage(null)
      setErrorMessage(null)

      const response = await fetch(buildApiUrl("/patient/create"), {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createPayload),
      })

      if (!response.ok) {
        const errorText = await parseApiError(
          response,
          `Unable to create patient (HTTP ${response.status}).`,
        )
        setCreatePatientMessage(errorText)
        return false
      }

      await loadPatients()
      setCreatePatientMessage(`Patient '${firstName} ${lastName}' created.`)
      return true
    } catch {
      setErrorMessage("Unable to create patient from API.")
      return false
    } finally {
      setIsCreatingPatient(false)
    }
  }

  return {
    query,
    visiblePatients,
    visibleCountLabel,
    isLoading,
    isCreatingPatient,
    errorMessage,
    createPatientMessage,
    onQueryChange,
    onCreatePatient,
  }
}

function mapApiPatientToRecord(apiPatient: ApiPatient): PatientRecord {
  const patientId = String(apiPatient.id)
  const name = `${apiPatient.first_name} ${apiPatient.last_name}`.trim()
  const createdDate = apiPatient.created_at ? new Date(apiPatient.created_at) : null

  return {
    id: patientId,
    name: name.length === 0 ? patientId : name,
    initials: getInitials(apiPatient.first_name, apiPatient.last_name, patientId),
    patientId,
    lastVisitLabel: createdDate ? formatDate(createdDate) : "No visits yet",
  }
}

function getInitials(firstName: string, lastName: string, fallback: string): string {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  const combined = `${first}${last}`.toUpperCase()

  if (combined.length > 0) {
    return combined
  }
  return fallback.slice(0, 2).toUpperCase()
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date)
}
