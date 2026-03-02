# Screenshot guide for Bulk User Update prototype

Capture these from the running app (`npm run dev`) to document the flow and edge cases.

## Where to save

Save under `docs/screenshots/` (create the folder if needed). Use descriptive names as below.

## Happy path (one per step)

| # | Step | Suggested filename | What to show |
|---|------|--------------------|--------------|
| 1 | User Selection | `01-user-selection.png` | Users added via search and/or filters; Selected users table filled. |
| 2 | Field Selection & Edit | `02-field-selection-filters.png` | Method "filters" selected; 1–2 field changes added. |
| 2b | Field Selection (CSV) | `02b-field-selection-csv.png` | Method "CSV" selected; template downloaded; upload area. |
| 3 | Validation & Errors | `03-validation-errors.png` | Validation summary with multiple errors. |
| 4 | Preview Changes | `04-preview.png` | Summary + sample table; optional "X users excluded". |
| 5 | Confirm & Submit | `05-confirm.png` | Recap + checkbox checked; Submit enabled. |
| 5b | Submit success | `05b-submit-success.png` | Success message with Request ID; stepper on Step 6. |
| 6 | Approval (pending) | `06-approval-pending.png` | Pending approval message and Request ID. |
| 6b | Approval (approved) | `06b-approval-approved.png` | Approved state and "View in Edit History". |
| 7 | Edit History | `07-edit-history.png` | Table with at least one request; View details / Reverse. |

## Edge cases

| Case | Suggested filename | How to get there |
|------|--------------------|------------------|
| No users selected | `edge-01-no-users.png` | Step 1, empty Selected users; Continue disabled. |
| Search no results | `edge-02-search-no-results.png` | Step 1, type a query that matches no users. |
| Max users warning | `edge-03-max-users.png` | Step 1, add users until 500 (or trigger warning in UI). |
| Filter 0 users | `edge-04-filter-zero.png` | Step 1, filters tab with combination that matches 0. |
| Inline validation (filters) | `edge-05-validation-inline.png` | Step 2, invalid value in field (e.g. negative compensation). |
| CSV error modal | `edge-06-csv-errors.png` | Step 2, CSV method; upload a file; show error summary and "Download error CSV" / "Exclude" / "Re-upload". |
| Preview with excluded | `edge-07-preview-excluded.png` | Step 4 after choosing "Continue and exclude error rows". |
| Step 6 Rejected | `edge-08-rejected.png` | Step 6; click "Simulate: Reject". |
| Reverse confirmation | `edge-09-reverse-confirm.png` | Step 7; after one request is Applied; click Reverse and show confirm modal. |
| Reversal not available | `edge-10-reverse-na.png` | Step 7; Pending request with "Reverse N/A" or disabled. |

## Left panel stepper

| Shot | Filename | What to show |
|------|----------|--------------|
| Mid-flow | `stepper-current.png` | Step 3 or 4 as current; 1–2 completed with checkmarks; rest upcoming. |
| Post-submit | `stepper-post-submit.png` | After submit; Step 6 active; steps 1–5 read-only (no checkmarks or muted). |

## Quick capture order

1. Start dev server, go to Step 1, add users → save `01-user-selection.png`.
2. Go to Step 2, add field changes → save `02-field-selection-filters.png`.
3. Switch to CSV, download template, upload file → save `02b-field-selection-csv.png` and `edge-06-csv-errors.png`.
4. Go to Step 3 → save `03-validation-errors.png`.
5. Go to Step 4 (with or without exclusions) → save `04-preview.png` and optionally `edge-07-preview-excluded.png`.
6. Step 5, check checkbox, submit → save `05-confirm.png` and `05b-submit-success.png`.
7. Step 6 → save `06-approval-pending.png`; simulate approve → save `06b-approval-approved.png`; or simulate reject → save `edge-08-rejected.png`.
8. Step 7 → save `07-edit-history.png`, `edge-09-reverse-confirm.png`, `edge-10-reverse-na.png`.
9. Capture stepper: `stepper-current.png`, `stepper-post-submit.png`.
10. Edge cases for Step 1: empty list, no results, max users, filter zero → save as in table above.
