import { useState } from "react"
import type { ChangeEvent } from "react"
import { PATIENTS, TOTAL_PATIENT_COUNT } from "@/features/patient-selection/model/constants"
import type { PatientRecord } from "@/features/patient-selection/model/types"

interface UsePatientSelectionResult {
  query: string
  visiblePatients: ReadonlyArray<PatientRecord>
  visibleCountLabel: string
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/**
 * Handles local search state and typed filtering logic for patient selection.
 */
export function usePatientSelection(): UsePatientSelectionResult {
  const [query, setQuery] = useState("")

  const normalizedQuery = query.trim().toLowerCase()
  const visiblePatients =
    normalizedQuery.length === 0
      ? PATIENTS
      : PATIENTS.filter((patient) => {
          const searchableText = `${patient.name} ${patient.trialId} ${patient.status}`.toLowerCase()
          return searchableText.includes(normalizedQuery)
        })

  const visibleCountLabel = `Showing ${visiblePatients.length} of ${TOTAL_PATIENT_COUNT} patients`

  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  return { query, visiblePatients, visibleCountLabel, onQueryChange }
}
