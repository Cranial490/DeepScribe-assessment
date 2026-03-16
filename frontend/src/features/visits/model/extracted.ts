import type { AgeGroup, ExtractedData, TrialSex } from "@/shared/types/clinical"

export interface ListDrafts {
  conditions: string
  interventions: string
  biomarker_and_molecular_terms: string
  preferred_locations: string
  biomarkers: string
  prior_treatments: string
}

export function createEmptyExtracted(): ExtractedData {
  return {
    patient: {
      age: null,
      sex: null,
      location: {
        city: null,
        state: null,
        country: null,
      },
    },
    clinical: {
      primary_diagnosis: null,
      disease_stage: null,
      biomarkers: [],
      prior_treatments: [],
    },
    trial_search: {
      conditions: [],
      interventions: [],
      biomarker_and_molecular_terms: [],
      preferred_locations: [],
      sex: "All",
      age_groups: [],
    },
    additional_relevant_facts: [],
  }
}

export function parseCommaListInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function buildListDrafts(raw: ExtractedData): ListDrafts {
  return {
    conditions: raw.trial_search.conditions.join(", "),
    interventions: raw.trial_search.interventions.join(", "),
    biomarker_and_molecular_terms: raw.trial_search.biomarker_and_molecular_terms.join(", "),
    preferred_locations: raw.trial_search.preferred_locations.join(", "),
    biomarkers: raw.clinical.biomarkers.join(", "),
    prior_treatments: raw.clinical.prior_treatments.join(", "),
  }
}

export function applyListDraftsToExtracted(raw: ExtractedData, drafts: ListDrafts): ExtractedData {
  return {
    ...raw,
    clinical: {
      ...raw.clinical,
      biomarkers: parseCommaListInput(drafts.biomarkers),
      prior_treatments: parseCommaListInput(drafts.prior_treatments),
    },
    trial_search: {
      ...raw.trial_search,
      conditions: parseCommaListInput(drafts.conditions),
      interventions: parseCommaListInput(drafts.interventions),
      biomarker_and_molecular_terms: parseCommaListInput(drafts.biomarker_and_molecular_terms),
      preferred_locations: parseCommaListInput(drafts.preferred_locations),
    },
  }
}

function normalizeTrialSex(rawSex: unknown): TrialSex {
  if (rawSex === "Male" || rawSex === "Female" || rawSex === "All") {
    return rawSex
  }
  return "All"
}

function normalizeAgeGroups(rawAgeGroups: unknown): AgeGroup[] {
  if (!Array.isArray(rawAgeGroups)) {
    return []
  }
  return rawAgeGroups.filter(
    (value): value is AgeGroup =>
      value === "Child" || value === "Adult" || value === "Older Adult",
  )
}

export function normalizeExtracted(raw: ExtractedData | null | undefined): ExtractedData {
  if (!raw) {
    return createEmptyExtracted()
  }

  return {
    patient: {
      age: raw.patient?.age ?? null,
      sex: raw.patient?.sex ?? null,
      location: {
        city: raw.patient?.location?.city ?? null,
        state: raw.patient?.location?.state ?? null,
        country: raw.patient?.location?.country ?? null,
      },
    },
    clinical: {
      primary_diagnosis: raw.clinical?.primary_diagnosis ?? null,
      disease_stage: raw.clinical?.disease_stage ?? null,
      biomarkers: raw.clinical?.biomarkers ?? [],
      prior_treatments: raw.clinical?.prior_treatments ?? [],
    },
    trial_search: {
      conditions: raw.trial_search?.conditions ?? [],
      interventions: raw.trial_search?.interventions ?? [],
      biomarker_and_molecular_terms: raw.trial_search?.biomarker_and_molecular_terms ?? [],
      preferred_locations: raw.trial_search?.preferred_locations ?? [],
      sex: normalizeTrialSex(raw.trial_search?.sex),
      age_groups: normalizeAgeGroups(raw.trial_search?.age_groups),
    },
    additional_relevant_facts: raw.additional_relevant_facts ?? [],
  }
}
