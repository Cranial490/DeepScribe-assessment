import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { VisitsScreen } from "@/features/visits/ui/VisitsScreen"

function createConsultationPayload(status: "processing" | "completed" | "failed") {
  return [
    {
      consultation_id: "c1",
      created_at: "2026-03-16T12:00:00Z",
      status,
    },
  ]
}

function renderVisits(patientId = "1") {
  return render(
    <VisitsScreen
      patientId={patientId}
      onBackToPatients={() => {}}
      onUploadTranscript={() => {}}
      onOpenConsultation={() => {}}
      onShowMatchingTrials={() => {}}
    />,
  )
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe("VisitsScreen polling", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it("polls every 5 seconds when consultations are processing", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createConsultationPayload("processing")), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createConsultationPayload("completed")), { status: 200 }),
      )

    renderVisits()

    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it("stops polling once all consultations are terminal", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createConsultationPayload("processing")), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createConsultationPayload("completed")), { status: 200 }),
      )

    renderVisits()

    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(15000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it("silently retries polling after transient polling errors", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createConsultationPayload("processing")), { status: 200 }),
      )
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createConsultationPayload("processing")), { status: 200 }),
      )

    renderVisits()

    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(screen.queryByText("Unable to load consultations.")).toBeNull()

    await vi.advanceTimersByTimeAsync(5000)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it("clears pending polling timers on unmount", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(createConsultationPayload("processing")), { status: 200 }),
      )

    const { unmount } = renderVisits()
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    unmount()

    await vi.advanceTimersByTimeAsync(10000)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("resets polling lifecycle when patient changes", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((input) => {
        const url = String(input)
        if (url.includes("/patient/1/consultations")) {
          return Promise.resolve(
            new Response(JSON.stringify(createConsultationPayload("processing")), { status: 200 }),
          )
        }
        return Promise.resolve(
          new Response(JSON.stringify(createConsultationPayload("completed")), { status: 200 }),
        )
      })

    const { rerender } = renderVisits("1")
    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    rerender(
      <VisitsScreen
        patientId="2"
        onBackToPatients={() => {}}
        onUploadTranscript={() => {}}
        onOpenConsultation={() => {}}
        onShowMatchingTrials={() => {}}
      />,
    )

    await flushMicrotasks()
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(10000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
