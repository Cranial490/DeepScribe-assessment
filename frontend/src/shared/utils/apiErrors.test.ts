import { describe, expect, it } from "vitest"
import { parseApiError } from "@/shared/utils/apiErrors"

describe("parseApiError", () => {
  it("returns string detail when present", async () => {
    const response = new Response(JSON.stringify({ detail: "bad request" }), { status: 400 })
    await expect(parseApiError(response, "fallback")).resolves.toBe("bad request")
  })

  it("returns first validation msg when detail is an array", async () => {
    const response = new Response(
      JSON.stringify({ detail: [{ msg: "field required" }, { msg: "ignored" }] }),
      { status: 422 },
    )
    await expect(parseApiError(response, "fallback")).resolves.toBe("field required")
  })

  it("returns fallback when payload is malformed", async () => {
    const response = new Response("not-json", { status: 500 })
    await expect(parseApiError(response, "fallback")).resolves.toBe("fallback")
  })
})
