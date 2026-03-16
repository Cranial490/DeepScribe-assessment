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
  keywords: string[]
  location_terms: string[]
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

  const queryTerms = normalizeUnique(trialSearch.keywords)
  const locationTerms = normalizeUnique(trialSearch.location_terms)

  const params = new URLSearchParams({
    format: "json",
    "query.cond": conditionTerms[0],
    "filter.overallStatus": "RECRUITING|NOT_YET_RECRUITING|ACTIVE_NOT_RECRUITING",
    fields: SEARCH_FIELDS.join(","),
    sort: "@relevance",
    pageSize: "10",
    countTotal: "true",
  })

  if (queryTerms.length > 0) {
    params.set("query.term", queryTerms.join(" "))
  }
  if (locationTerms.length > 0) {
    params.set("query.locn", locationTerms.join(", "))
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
