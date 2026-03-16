import { Search } from "lucide-react"
import { AppShell } from "@/app/AppShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CreatePatientInput } from "@/features/patient-selection/hooks/usePatientSelection"
import { PATIENT_BREADCRUMBS } from "@/features/patient-selection/model/constants"
import { PatientSelectionTable } from "@/features/patient-selection/ui/PatientSelectionTable"
import type { PatientRecord } from "@/features/patient-selection/model/types"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { PageHeader } from "@/shared/ui/PageHeader"

interface PatientSelectionScreenProps {
  query: string
  patients: ReadonlyArray<PatientRecord>
  visibleCountLabel: string
  isLoading: boolean
  isCreatingPatient: boolean
  errorMessage: string | null
  createPatientMessage: string | null
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void
  onCreatePatient: (input: CreatePatientInput) => Promise<boolean>
  onSelectPatient: (patientId: string) => void
}

/**
 * Presentational screen for trial patient selection.
 */
export function PatientSelectionScreen({
  query,
  patients,
  visibleCountLabel,
  isLoading,
  isCreatingPatient,
  errorMessage,
  createPatientMessage,
  onQueryChange,
  onCreatePatient,
  onSelectPatient,
}: PatientSelectionScreenProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const created = await onCreatePatient({ firstName, lastName, dateOfBirth })
    if (created) {
      setIsCreateModalOpen(false)
      setFirstName("")
      setLastName("")
      setDateOfBirth("")
    }
  }

  return (
    <AppShell>
      <section>
          <PageHeader breadcrumbs={PATIENT_BREADCRUMBS.map((crumb) => crumb.label)} />

          <main className="px-6 py-9 lg:px-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl space-y-4">
                <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
                  Patient Selection
                </h1>
                <p className="max-w-2xl text-2xl leading-relaxed text-slate-500">
                  Select a trial participant or initiate a new clinical intake
                  session. Managed with ambient clinical intelligence.
                </p>
              </div>

              <div className="flex flex-col items-end gap-3">
                <Button
                  className="h-14 rounded-full px-9 text-lg font-semibold shadow-sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={isCreatingPatient}
                >
                  Create New Patient
                </Button>
                {createPatientMessage ? (
                  <p className="text-sm font-medium text-slate-500">
                    {createPatientMessage}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 space-y-6 lg:mt-10">
              <div className="relative">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={onQueryChange}
                  placeholder="Search patients by name or ID..."
                  className="h-16 rounded-3xl border-border/80 bg-white px-14 text-lg placeholder:text-slate-400"
                />
              </div>

              {errorMessage ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <PatientSelectionTable
                patients={patients}
                visibleCountLabel={visibleCountLabel}
                isLoading={isLoading}
                onSelectPatient={onSelectPatient}
              />
            </div>
          </main>
      </section>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Create Patient</h2>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setDateOfBirth("")
                }}
                disabled={isCreatingPatient}
                aria-label="Close modal"
              >
                x
              </button>
            </div>

            <form className="space-y-4" onSubmit={(event) => void onCreateSubmit(event)}>
              <div className="space-y-2">
                <label htmlFor="patient-first-name" className="text-sm font-medium">
                  First name
                </label>
                <Input
                  id="patient-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Enter first name"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="patient-last-name" className="text-sm font-medium">
                  Last name
                </label>
                <Input
                  id="patient-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Enter last name"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="patient-dob" className="text-sm font-medium">
                  Date of birth
                </label>
                <Input
                  id="patient-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  className="h-11"
                />
              </div>

              {createPatientMessage ? (
                <p className="text-sm font-medium text-red-600">{createPatientMessage}</p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setDateOfBirth("")
                  }}
                  disabled={isCreatingPatient}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingPatient}>
                  {isCreatingPatient ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
