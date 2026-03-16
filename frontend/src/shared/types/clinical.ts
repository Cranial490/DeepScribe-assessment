export type TrialSex = "Male" | "Female" | "All"

export type AgeGroup = "Child" | "Adult" | "Older Adult"

export interface TrialSearchInput {
  conditions: string[]
  interventions: string[]
  biomarker_and_molecular_terms: string[]
  preferred_locations: string[]
  sex: TrialSex
  age_groups: AgeGroup[]
}

export interface AdditionalRelevantFact {
  category: string | null
  fact: string | null
  source_text: string | null
}

export interface ExtractedData {
  patient: {
    age: number | null
    sex: string | null
    location: {
      city: string | null
      state: string | null
      country: string | null
    }
  }
  clinical: {
    primary_diagnosis: string | null
    disease_stage: string | null
    biomarkers: string[]
    prior_treatments: string[]
  }
  trial_search: TrialSearchInput
  additional_relevant_facts: AdditionalRelevantFact[]
}

export interface ClinicalTrialStudy {
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
}
