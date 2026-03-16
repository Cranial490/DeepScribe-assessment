import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useVisitDetailEditor } from "@/features/visits/hooks/useVisitDetailEditor"
import { createEmptyExtracted } from "@/features/visits/model/extracted"

describe("useVisitDetailEditor", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("loads consultation and computes dirty state transitions", async () => {
    const extracted = createEmptyExtracted()
    extracted.trial_search.conditions = ["A"]

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            consultation_id: "c1",
            raw_transcript: "hello world",
            status: "completed",
            llm_extracted: extracted,
          },
        ]),
        { status: 200 },
      ),
    )

    const { result } = renderHook(() =>
      useVisitDetailEditor({ patientId: "1", consultationId: "c1" }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.errorMessage).toBeNull()
    })

    expect(result.current.isDirty).toBe(false)

    act(() => {
      result.current.setListDrafts((current) => ({ ...current, conditions: "A, B" }))
    })

    expect(result.current.isDirty).toBe(true)
  })

  it("surfaces save error when edit API fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              consultation_id: "c1",
              raw_transcript: "test transcript",
              status: "completed",
              llm_extracted: createEmptyExtracted(),
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "save failed" }), {
          status: 400,
        }),
      )

    const { result } = renderHook(() =>
      useVisitDetailEditor({ patientId: "1", consultationId: "c1" }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setExtracted((current) => ({
        ...current,
        patient: { ...current.patient, sex: "Male" },
      }))
    })

    await act(async () => {
      await result.current.onSave()
    })

    expect(result.current.saveError).toBe("save failed")
  })
})
