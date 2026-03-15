/**
 * Supported patient lifecycle statuses for the clinical trial workspace.
 */
export type PatientStatus = "active" | "pending_review" | "completed"

/**
 * Single patient row in the patient selection table.
 */
export interface PatientRecord {
  id: string
  name: string
  initials: string
  patientId: string
  lastVisitLabel: string
}

/**
 * Breadcrumb metadata used by the workspace header.
 */
export interface BreadcrumbItem {
  label: string
  href?: string
}
