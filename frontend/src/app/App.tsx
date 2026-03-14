import { usePatientSelection } from "@/features/patient-selection/hooks/usePatientSelection"
import { PatientSelectionScreen } from "@/features/patient-selection/ui/PatientSelectionScreen"

/**
 * Root container component for the frontend app entrypoint.
 */
export default function App() {
  const { query, visiblePatients, visibleCountLabel, onQueryChange } =
    usePatientSelection()

  return (
    <PatientSelectionScreen
      query={query}
      patients={visiblePatients}
      visibleCountLabel={visibleCountLabel}
      onQueryChange={onQueryChange}
    />
  )
}
