const CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

const SEARCH_FIELDS = [
  "NCTId",
  "BriefTitle",
  "BriefSummary",
  "Phase",
]

const STUDY_FIELDS = [
  "NCTId",
  "BriefTitle",
  "Condition",
  "StudyType",
  "Phase",
  "LeadSponsorName",
  "InterventionName",
  "InterventionType",
  "InterventionDescription",
  "PrimaryOutcomeMeasure",
  "PrimaryOutcomeDescription",
  "StdAge",
  "LocationFacility",
  "LocationCity",
  "LocationState",
  "LocationCountry",
  "LocationStatus",
  "BriefSummary",
]

interface TrialSearchInputs {
  conditions: string[]
  interventions: string[]
  biomarker_and_molecular_terms: string[]
  preferred_locations: string[]
  sex: "Male" | "Female" | "All" | null
  age_groups: Array<"Child" | "Adult" | "Older Adult">
}

export interface ClinicalTrialsResponse {
  studies?: Array<{
    protocolSection?: {
      identificationModule?: {
        nctId?: string
        briefTitle?: string
      }
      descriptionModule?: {
        briefSummary?: string
      }
      designModule?: {
        phases?: string[]
      }
    }
  }>
  nextPageToken?: string
}

export function normalizeUnique(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const rawValue of values) {
    if (!rawValue) {
      continue
    }
    const cleaned = rawValue.trim()
    if (!cleaned) {
      continue
    }
    const key = cleaned.toLowerCase()
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    normalized.push(cleaned)
  }

  return normalized
}

export function buildTrialSearchParams(
  trialSearch: TrialSearchInputs,
  pageToken?: string,
): URLSearchParams {
  const conditionTerms = normalizeUnique(trialSearch.conditions)
  if (conditionTerms.length === 0) {
    throw new Error("Cannot fetch trials: trial_search.conditions is missing.")
  }

  const interventionTerms = normalizeUnique(trialSearch.interventions)
  const biomarkerTerms = normalizeUnique(trialSearch.biomarker_and_molecular_terms)
  const locationTerms = normalizeUnique(trialSearch.preferred_locations)
  const ageGroups = normalizeUnique(trialSearch.age_groups)

  const params = new URLSearchParams({
    format: "json",
    "query.cond": conditionTerms.join(" OR "),
    "filter.overallStatus": "RECRUITING",
    fields: SEARCH_FIELDS.join(","),
    sort: "@relevance",
    pageSize: "10",
    countTotal: "true",
  })

  if (interventionTerms.length > 0) {
    params.set("query.intr", interventionTerms.join(" AND "))
  }
  if (biomarkerTerms.length > 0) {
    params.set("query.term", biomarkerTerms.join(" AND "))
  }
  if (locationTerms.length > 0) {
    params.set("query.locn", locationTerms.join(" "))
  }

  const advancedFilters: string[] = []
  if (trialSearch.sex === "Male" || trialSearch.sex === "Female" || trialSearch.sex === "All") {
    advancedFilters.push(`AREA[Sex] ${trialSearch.sex.toUpperCase()}`)
  }
  if (ageGroups.length > 0) {
    const stdAgeValueByLabel: Record<string, string> = {
      Child: "CHILD",
      Adult: "ADULT",
      "Older Adult": "OLDER_ADULT",
    }
    const ageFilter = ageGroups
      .map((value) => `AREA[StdAge] ${stdAgeValueByLabel[value] ?? value}`)
      .join(" OR ")
    advancedFilters.push(ageFilter)
  }
  if (advancedFilters.length > 0) {
    params.set("filter.advanced", advancedFilters.join(" AND "))
  }
  if (pageToken) {
    params.set("pageToken", pageToken)
  }

  return params
}

export async function fetchClinicalTrials(
  trialSearch: TrialSearchInputs,
  pageToken?: string,
  signal?: AbortSignal,
): Promise<ClinicalTrialsResponse> {
  const params = buildTrialSearchParams(trialSearch, pageToken)
  const response = await fetch(`${CLINICAL_TRIALS_BASE_URL}?${params.toString()}`, {
    method: "GET",
    signal,
  })

  if (!response.ok) {
    throw new Error(mapClinicalTrialsError(response.status))
  }

  return (await response.json()) as ClinicalTrialsResponse
}

export async function fetchClinicalTrialDetail(
  nctId: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const normalizedNctId = nctId.trim()
  if (!normalizedNctId) {
    throw new Error("Missing NCT ID in route.")
  }

  const params = new URLSearchParams({
    format: "json",
    fields: STUDY_FIELDS.join(","),
  })
  const response = await fetch(
    `${CLINICAL_TRIALS_BASE_URL}/${encodeURIComponent(normalizedNctId)}?${params.toString()}`,
    {
      method: "GET",
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(mapClinicalTrialsError(response.status))
  }

  return (await response.json()) as unknown
}

export function mapClinicalTrialsError(status: number): string {
  if (status === 403) {
    return "ClinicalTrials request blocked; try fewer keywords or retry."
  }
  if (status === 429 || status >= 500) {
    return "ClinicalTrials is temporarily unavailable. Please retry."
  }
  return `Unable to load data from ClinicalTrials (HTTP ${status}).`
}
