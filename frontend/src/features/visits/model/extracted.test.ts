import { describe, expect, it } from "vitest"
import {
  applyListDraftsToExtracted,
  buildListDrafts,
  createEmptyExtracted,
  normalizeExtracted,
  parseCommaListInput,
} from "@/features/visits/model/extracted"

describe("visit extracted helpers", () => {
  it("parses comma-separated input into trimmed values", () => {
    expect(parseCommaListInput("A,  B ,, C  ")).toEqual(["A", "B", "C"])
  })

  it("builds and re-applies list drafts", () => {
    const extracted = createEmptyExtracted()
    extracted.trial_search.conditions = ["Lung cancer", "EGFR"]
    extracted.clinical.biomarkers = ["ALK"]

    const drafts = buildListDrafts(extracted)
    expect(drafts.conditions).toBe("Lung cancer, EGFR")

    const updated = applyListDraftsToExtracted(extracted, {
      ...drafts,
      biomarkers: "ALK, ROS1",
    })
    expect(updated.clinical.biomarkers).toEqual(["ALK", "ROS1"])
  })

  it("normalizes invalid trial_search enums", () => {
    const normalized = normalizeExtracted({
      ...createEmptyExtracted(),
      trial_search: {
        ...createEmptyExtracted().trial_search,
        sex: "invalid" as never,
        age_groups: ["Adult", "Invalid"] as never,
      },
    })

    expect(normalized.trial_search.sex).toBe("All")
    expect(normalized.trial_search.age_groups).toEqual(["Adult"])
  })
})
