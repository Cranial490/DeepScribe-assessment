import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { assertNever } from "@/shared/types/exhaustive"
import type { PatientStatus } from "@/features/patient-selection/model/types"

interface PatientStatusBadgeProps {
  status: PatientStatus
}

/**
 * Maps trial status values to a consistent visual badge treatment.
 */
export function PatientStatusBadge({ status }: PatientStatusBadgeProps) {
  const config = getStatusBadgeConfig(status)

  return (
    <Badge
      className={cn(
        "rounded-full border-transparent px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em]",
        config.className,
      )}
    >
      {config.label}
    </Badge>
  )
}

interface StatusBadgeConfig {
  label: string
  className: string
}

function getStatusBadgeConfig(status: PatientStatus): StatusBadgeConfig {
  switch (status) {
    case "active":
      return {
        label: "Active",
        className: "bg-emerald-100 text-emerald-700",
      }
    case "pending_review":
      return {
        label: "Pending Review",
        className: "bg-amber-100 text-amber-700",
      }
    case "completed":
      return {
        label: "Completed",
        className: "bg-slate-200 text-slate-600",
      }
    default:
      return assertNever(status)
  }
}
