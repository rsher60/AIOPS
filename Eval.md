## Setting Evals for each checkpoints 


Human Evaluation

  Run monthly or after major prompt/model changes. Use people who know what a good resume looks like — recruiters, hiring
  managers, or senior career coaches — not generic annotators.

  3.1 — Recruiter Preference Test (A vs. B)

  Show a recruiter the original resume and the AI-generated version side by side without labels. Ask:
  - Which would you be more likely to move forward with for role X?
  - What specifically is better or worse?

  Track win rate. Target: AI version preferred ≥ 70% of the time.

  3.2 — ATS Simulation

  Pick 5–10 real job descriptions for common target roles. Run the generated resume through an ATS simulator (Jobscan or
  similar). Measure keyword match rate. Target: ≥ 70% match for exact-match keywords from the job description. 

Eval 1 : How many of the keywrods in the user's resume are there in the Final generated Resume
Eval 2: If the person uploads a Job description, how many of those are in the final generated Resume

  3.3 — Annotation Rubric for Blind Scoring

  Give annotators this rubric (1–5 scale per dimension):

  Dimension: Professional summary quality
  1: Generic, could be anyone
  3: Mentions role but vague
  5: Compelling, specific, role-targeted
  ────────────────────────────────────────
  Dimension: Experience bullet quality
  1: Duties-based ("Responsible for X")
  3: Mix of duties and outcomes
  5: All STAR-method, quantified outcomes
  ────────────────────────────────────────
  Dimension: Contact accuracy
  1: Wrong info
  3: Missing fields
  5: All fields correct and complete
  ────────────────────────────────────────
  Dimension: Overall hirability
  1: Would not pass initial screen
  3: Might pass
  5: Strong candidate impression

  Use comparative eval where possible: show annotators two outputs from different models or prompt versions and ask which is
  better per dimension. Humans are more reliable at relative judgments.

  ---
  Data Strategy

  Golden dataset — build this now

  Curate 30–50 representative test cases covering:

  ┌────────────────────────────────────────────┬─────────────────────────────────────────────────┐
  │                   Slice                    │                 Why it matters                  │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Resume only (no LinkedIn)                  │ Tests base performance                          │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ LinkedIn only (no resume)                  │ Tests alternate source handling                 │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Both sources with conflicting contact info │ Tests priority rules                            │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ No files, only notes                       │ Tests cold-start generation                     │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Technical roles (SWE, Data Scientist)      │ Keyword density matters more                    │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Non-technical roles (PM, Marketing)        │ Soft skills and narrative matter more           │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Senior roles (10+ years exp)               │ Risk of truncation, should be dense             │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Junior/entry-level                         │ Risk of padding, should be appropriately scoped │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Very sparse input (few notes, no PDF)      │ Tests graceful handling of low-context          │
  ├────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ Very long resume PDF                       │ Tests truncation/merging behavior               │
  └────────────────────────────────────────────┴─────────────────────────────────────────────────┘
