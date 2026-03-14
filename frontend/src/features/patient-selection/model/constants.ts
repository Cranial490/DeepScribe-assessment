import type { BreadcrumbItem, PatientRecord } from "@/features/patient-selection/model/types"

export const PATIENT_BREADCRUMBS: ReadonlyArray<BreadcrumbItem> = [
  { label: "Clinical Trials", href: "#" },
  { label: "Patient Selection" },
]

export const PATIENTS: ReadonlyArray<PatientRecord> = [
  {
    id: "pt-001",
    name: "Elena Hernandez",
    initials: "EH",
    trialId: "TR-9821-A",
    status: "active",
    lastVisitLabel: "Oct 12, 2023",
  },
  {
    id: "pt-002",
    name: "James Carter",
    initials: "JC",
    trialId: "TR-9844-C",
    status: "pending_review",
    lastVisitLabel: "Oct 08, 2023",
  },
  {
    id: "pt-003",
    name: "Sarah Lund",
    initials: "SL",
    trialId: "TR-7721-B",
    status: "active",
    lastVisitLabel: "Oct 05, 2023",
  },
  {
    id: "pt-004",
    name: "Marcus Kim",
    initials: "MK",
    trialId: "TR-5512-F",
    status: "completed",
    lastVisitLabel: "Sep 28, 2023",
  },
]

export const TOTAL_PATIENT_COUNT = 128
