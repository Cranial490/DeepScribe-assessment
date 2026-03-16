import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "@/app/App"

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  )
}

describe("App route smoke tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input)

      if (url.includes("/patient/") && !url.includes("/consultations")) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }

      if (url.includes("/consultations/c1/extracted")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: "completed",
              trial_search: { conditions: ["Cancer"] },
            }),
            { status: 200 },
          ),
        )
      }

      if (url.includes("/patient/1/consultations")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                consultation_id: "c1",
                raw_transcript: "demo transcript",
                status: "completed",
                llm_extracted: null,
              },
            ]),
            { status: 200 },
          ),
        )
      }

      return Promise.resolve(new Response(JSON.stringify({ studies: [] }), { status: 200 }))
    })
  })

  it("renders patient selection route", async () => {
    renderRoute("/")
    expect(await screen.findByRole("heading", { name: "Patient Selection" })).toBeTruthy()
  })

  it("renders visits route", async () => {
    renderRoute("/visits/1")
    expect(await screen.findByRole("heading", { name: "Patient Visits" })).toBeTruthy()
  })

  it("renders visit detail route", async () => {
    renderRoute("/visits/1/c1")
    expect(await screen.findByRole("heading", { name: "Extracted Structured Data" })).toBeTruthy()
  })

  it("renders upload transcript route", async () => {
    renderRoute("/upload-transcript/1")
    expect(await screen.findByRole("heading", { name: "New Consultation" })).toBeTruthy()
  })

  it("renders trials route", async () => {
    renderRoute("/trials/1/c1")
    expect(await screen.findByRole("heading", { name: "Matching Trials" })).toBeTruthy()
  })

  it("renders trial detail route", async () => {
    renderRoute("/trial/NCT1")
    expect(await screen.findByRole("heading", { name: "NCT1" })).toBeTruthy()
  })
})
