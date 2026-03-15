import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { usePatientSelection } from "@/features/patient-selection/hooks/usePatientSelection"
import { PatientSelectionScreen } from "@/features/patient-selection/ui/PatientSelectionScreen"
import { VisitsScreen } from "@/features/visits/ui/VisitsScreen"
import { VisitDetailScreen } from "@/features/visits/ui/VisitDetailScreen"
import { UploadTranscriptScreen } from "@/features/transcript-upload/ui/UploadTranscriptScreen"

/**
 * Root container component for the frontend app entrypoint.
 */
export default function App() {
  const navigate = useNavigate()
  const {
    query,
    visiblePatients,
    visibleCountLabel,
    isLoading,
    isCreatingPatient,
    errorMessage,
    createPatientMessage,
    onQueryChange,
    onCreatePatient,
  } = usePatientSelection()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PatientSelectionScreen
            query={query}
            patients={visiblePatients}
            visibleCountLabel={visibleCountLabel}
            isLoading={isLoading}
            isCreatingPatient={isCreatingPatient}
            errorMessage={errorMessage}
            createPatientMessage={createPatientMessage}
            onQueryChange={onQueryChange}
            onCreatePatient={onCreatePatient}
            onSelectPatient={(patientId) => navigate(`/visits/${patientId}`)}
          />
        }
      />
      <Route path="/visits/:patientId" element={<VisitsRoute />} />
      <Route path="/visits/:patientId/:consultationId" element={<VisitDetailRoute />} />
      <Route path="/upload-transcript/:patientId" element={<UploadTranscriptRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function VisitsRoute() {
  const navigate = useNavigate()
  const params = useParams<{ patientId: string }>()
  return (
    <VisitsScreen
      patientId={params.patientId ?? null}
      onBackToPatients={() => navigate("/")}
      onUploadTranscript={() => navigate(`/upload-transcript/${params.patientId ?? ""}`)}
      onOpenConsultation={(consultationId) =>
        navigate(`/visits/${params.patientId ?? ""}/${consultationId}`)
      }
    />
  )
}

function VisitDetailRoute() {
  const navigate = useNavigate()
  const params = useParams<{ patientId: string; consultationId: string }>()
  return (
    <VisitDetailScreen
      patientId={params.patientId ?? null}
      consultationId={params.consultationId ?? null}
      onBackToVisits={() => navigate(`/visits/${params.patientId ?? ""}`)}
    />
  )
}

function UploadTranscriptRoute() {
  const navigate = useNavigate()
  const params = useParams<{ patientId: string }>()
  return (
    <UploadTranscriptScreen
      patientId={params.patientId ?? null}
      onBackToVisits={() => navigate(`/visits/${params.patientId ?? ""}`)}
    />
  )
}
