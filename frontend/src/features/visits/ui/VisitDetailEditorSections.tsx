import { Info } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import { parseCommaListInput, type ListDrafts } from "@/features/visits/model/extracted"
import { Field, MultiSelectField, SelectField } from "@/features/visits/ui/VisitFieldControls"
import type { ExtractedData } from "@/shared/types/clinical"

interface VisitDetailEditorSectionsProps {
  extracted: ExtractedData
  listDrafts: ListDrafts
  setExtracted: Dispatch<SetStateAction<ExtractedData>>
  setListDrafts: Dispatch<SetStateAction<ListDrafts>>
}

export function VisitDetailEditorSections({
  extracted,
  listDrafts,
  setExtracted,
  setListDrafts,
}: VisitDetailEditorSectionsProps) {
  return (
    <div className="mt-6 max-h-[calc(100vh-290px)] space-y-6 overflow-auto pr-1">
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Patient
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Age"
            value={extracted.patient.age?.toString() ?? ""}
            onChange={(value) =>
              setExtracted((current) => ({
                ...current,
                patient: {
                  ...current.patient,
                  age: value.trim().length === 0 ? null : Number(value),
                },
              }))
            }
          />
          <Field
            label="Sex"
            value={extracted.patient.sex ?? ""}
            onChange={(value) =>
              setExtracted((current) => ({
                ...current,
                patient: { ...current.patient, sex: value || null },
              }))
            }
          />
          <Field
            label="City"
            value={extracted.patient.location.city ?? ""}
            onChange={(value) =>
              setExtracted((current) => ({
                ...current,
                patient: {
                  ...current.patient,
                  location: { ...current.patient.location, city: value || null },
                },
              }))
            }
          />
          <Field
            label="State"
            value={extracted.patient.location.state ?? ""}
            onChange={(value) =>
              setExtracted((current) => ({
                ...current,
                patient: {
                  ...current.patient,
                  location: { ...current.patient.location, state: value || null },
                },
              }))
            }
          />
          <Field
            label="Country"
            value={extracted.patient.location.country ?? ""}
            onChange={(value) =>
              setExtracted((current) => ({
                ...current,
                patient: {
                  ...current.patient,
                  location: { ...current.patient.location, country: value || null },
                },
              }))
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Trial Search
          </h2>
          <div className="group relative">
            <Info className="h-4 w-4 text-slate-500" />
            <div className="pointer-events-none absolute bottom-6 left-0 z-10 hidden w-64 rounded-md border border-slate-200 bg-white p-2 text-xs normal-case tracking-normal text-slate-700 shadow-md group-hover:block">
              These fields are used for trial search. Update these for better trial matches.
            </div>
          </div>
        </div>
        <Field
          label="Conditions (comma separated)"
          value={listDrafts.conditions}
          onChange={(value) =>
            setListDrafts((current) => ({ ...current, conditions: value }))
          }
          onBlur={() =>
            setExtracted((current) => ({
              ...current,
              trial_search: {
                ...current.trial_search,
                conditions: parseCommaListInput(listDrafts.conditions),
              },
            }))
          }
        />
        <Field
          label="Interventions (comma separated)"
          value={listDrafts.interventions}
          onChange={(value) =>
            setListDrafts((current) => ({ ...current, interventions: value }))
          }
          onBlur={() =>
            setExtracted((current) => ({
              ...current,
              trial_search: {
                ...current.trial_search,
                interventions: parseCommaListInput(listDrafts.interventions),
              },
            }))
          }
        />
        <Field
          label="Biomarker Terms (comma separated)"
          value={listDrafts.biomarker_and_molecular_terms}
          onChange={(value) =>
            setListDrafts((current) => ({
              ...current,
              biomarker_and_molecular_terms: value,
            }))
          }
          onBlur={() =>
            setExtracted((current) => ({
              ...current,
              trial_search: {
                ...current.trial_search,
                biomarker_and_molecular_terms: parseCommaListInput(
                  listDrafts.biomarker_and_molecular_terms,
                ),
              },
            }))
          }
        />
        <Field
          label="Preferred Locations (comma separated)"
          value={listDrafts.preferred_locations}
          onChange={(value) =>
            setListDrafts((current) => ({ ...current, preferred_locations: value }))
          }
          onBlur={() =>
            setExtracted((current) => ({
              ...current,
              trial_search: {
                ...current.trial_search,
                preferred_locations: parseCommaListInput(listDrafts.preferred_locations),
              },
            }))
          }
        />
        <SelectField
          label="Trial Sex"
          value={extracted.trial_search.sex}
          options={["Male", "Female", "All"]}
          onChange={(value) =>
            setExtracted((current) => ({
              ...current,
              trial_search: {
                ...current.trial_search,
                sex:
                  value === "Male" || value === "Female" || value === "All"
                    ? value
                    : "All",
              },
            }))
          }
        />
        <MultiSelectField
          label="Age Groups"
          options={["Child", "Adult", "Older Adult"]}
          values={extracted.trial_search.age_groups}
          onToggle={(value) =>
            setExtracted((current) => {
              const exists = current.trial_search.age_groups.includes(value)
              return {
                ...current,
                trial_search: {
                  ...current.trial_search,
                  age_groups: exists
                    ? current.trial_search.age_groups.filter((item) => item !== value)
                    : [...current.trial_search.age_groups, value],
                },
              }
            })
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Clinical
        </h2>
        <Field
          label="Primary Diagnosis"
          value={extracted.clinical.primary_diagnosis ?? ""}
          onChange={(value) =>
            setExtracted((current) => ({
              ...current,
              clinical: { ...current.clinical, primary_diagnosis: value || null },
            }))
          }
        />
        <Field
          label="Disease Stage"
          value={extracted.clinical.disease_stage ?? ""}
          onChange={(value) =>
            setExtracted((current) => ({
              ...current,
              clinical: { ...current.clinical, disease_stage: value || null },
            }))
          }
        />
        <Field
          label="Biomarkers (comma separated)"
          value={listDrafts.biomarkers}
          onChange={(value) =>
            setListDrafts((current) => ({ ...current, biomarkers: value }))
          }
          onBlur={() =>
            setExtracted((current) => ({
              ...current,
              clinical: {
                ...current.clinical,
                biomarkers: parseCommaListInput(listDrafts.biomarkers),
              },
            }))
          }
        />
        <Field
          label="Prior Treatments (comma separated)"
          value={listDrafts.prior_treatments}
          onChange={(value) =>
            setListDrafts((current) => ({ ...current, prior_treatments: value }))
          }
          onBlur={() =>
            setExtracted((current) => ({
              ...current,
              clinical: {
                ...current.clinical,
                prior_treatments: parseCommaListInput(listDrafts.prior_treatments),
              },
            }))
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Additional Relevant Facts
        </h2>
        {extracted.additional_relevant_facts.length === 0 ? (
          <p className="rounded-lg border border-border/70 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            No additional facts extracted.
          </p>
        ) : (
          extracted.additional_relevant_facts.map((fact, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-border/70 bg-slate-50/70 p-3">
              <Field
                label="Category"
                value={fact.category ?? ""}
                onChange={(value) =>
                  setExtracted((current) => ({
                    ...current,
                    additional_relevant_facts: current.additional_relevant_facts.map(
                      (item, itemIndex) =>
                        itemIndex === index ? { ...item, category: value || null } : item,
                    ),
                  }))
                }
              />
              <Field
                label="Fact"
                value={fact.fact ?? ""}
                onChange={(value) =>
                  setExtracted((current) => ({
                    ...current,
                    additional_relevant_facts: current.additional_relevant_facts.map(
                      (item, itemIndex) =>
                        itemIndex === index ? { ...item, fact: value || null } : item,
                    ),
                  }))
                }
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Source Text
                </label>
                <textarea
                  value={fact.source_text ?? ""}
                  onChange={(event) =>
                    setExtracted((current) => ({
                      ...current,
                      additional_relevant_facts: current.additional_relevant_facts.map(
                        (item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, source_text: event.target.value || null }
                            : item,
                      ),
                    }))
                  }
                  className="min-h-[90px] w-full rounded-lg border border-border/80 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400"
                />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
