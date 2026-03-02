# Bulk User Information Update – Design Flow & Working Details

This document describes the UI flow, working details for each screen, and edge cases for the Rippling Bulk User Update prototype (Desktop).

---

## Layout

- **Left panel (240px):** Stepper with 7 steps. Current step is bold and highlighted with an "In progress" badge. Completed steps show a checkmark and are clickable (except after submit, when steps 1–5 are read-only). Step 7 (Edit History) is always accessible.
- **Main content:** Step-specific form, preview, or status content.

---

## Step 1 – User Selection

**Purpose:** Build the set of users who will be updated.

### Working details

| Element | Behavior |
|--------|----------|
| Tabs | "Search by name or ID" and "Add by filters" switch between two modes. |
| Search input | Typeahead: type name or ID; results list updates. Only first 10 results shown in table. |
| Add (search) | Adds the user to Selected users. Disabled if user already in list; shows "Already added". |
| Add filter | Choose Field (Country, Role, Department), then value. For Role: "All in role" or select APM, PM, SPM. Multiple filters combine with AND. |
| Remove filter | X on filter chip removes that filter. |
| Total users matching | Live count when filters are applied. "Add matching users to list" applies filters and adds those users to Selected users (up to 500). |
| Download user list | Exports current selected users as CSV (mock in prototype). |
| Selected users table | Lists name, ID, role, department; Remove drops user from list. |
| Continue | Enabled only when at least one user is selected. Goes to Step 2. |

### Edge cases

| Case | Trigger | UI behavior |
|------|--------|-------------|
| No results | Search query matches no users | Table shows "No results found. Try a different search." |
| Duplicate add | User already in Selected users | Row shows "Already added"; Add not offered. |
| Max users (500) | Selected users count reaches 500 | "Maximum 500 users allowed" message; Add does not add more. |
| Zero users | Filters match 0 users | Total shows 0; "Add matching users" adds none. |
| No users selected | User clicks Continue with empty list | Continue is disabled. |
| Large filter set | Filter count > 10,000 | Warning: "Consider narrowing filters or use a limit." |

---

## Step 2 – Field Selection & Edit

**Purpose:** Choose method (filters vs CSV) and define the edits.

### Working details

| Element | Behavior |
|--------|----------|
| Method | Radio: "Edit by filters & rules" or "Edit by CSV upload". Gates the rest of the step. |
| **Filters path:** | |
| Field dropdown | Select field: Compensation, Title, Department, Location, Level. |
| Operation | Depends on field. Compensation: Change to, Increase/Decrease by amount or %. Others: Change to. |
| Value input | Text/number/currency; validated on blur and on Add. |
| Add change | Appends to list of field changes. Validation errors block add and show under input. |
| Remove | Removes that field change from the list. |
| **CSV path:** | |
| Download template | Downloads CSV with selected users and current attributes (required columns). |
| Upload CSV | File picker or drag-drop; accepts .csv only. On upload, validation runs. |
| Validation results (errors) | Modal/section: "X rows have errors", "Download error CSV", "Continue and exclude error rows", "Re-upload corrected CSV". Error CSV has Error type and Error description columns; colour-coded in doc. |
| Continue / Preview | If filters: enabled when at least one field change. If CSV: enabled after upload (with or without errors). Button label: "Review errors" if errors and not excluding; "Preview changes" otherwise. |
| Back | Returns to Step 1. |

### Edge cases

| Case | Trigger | UI behavior |
|------|--------|-------------|
| Invalid format | Currency/date/number invalid | Inline error under input; Add disabled. |
| Out of range | e.g. percentage &gt; 100 | Inline error; Add disabled. |
| Wrong file type | Upload non-CSV | Validation error: "File must be a CSV." |
| Empty file | CSV has no data rows | Validation reports error. |
| Rows with errors | Some rows fail validation | Error summary; Download error CSV; user chooses exclude or re-upload. |
| Re-upload | User chooses "Re-upload corrected CSV" | File cleared; user must upload full CSV again. |

---

## Step 3 – Validation & Errors

**Purpose:** Central place to see and fix validation/format errors before preview.

### Working details

| Element | Behavior |
|--------|----------|
| Validation summary | List of issues with field name, message, and type (validation/format). |
| Fix in place | For filters path, user corrects in Step 2 and returns; Step 3 shows same errors until fixed or excluded. |
| Re-upload corrected CSV | (CSV path) Clears file and returns to Step 2 upload. |
| Continue and exclude error rows | Only valid rows will be updated; excluded count shown in Preview. |
| Revalidate and preview | Clears validation state and goes to Step 4. |
| Back | Goes to Step 2. |

### Edge cases

| Case | Trigger | UI behavior |
|------|--------|-------------|
| Partial fix | Some errors fixed, some remain | Summary updates; "Revalidate and preview" still available; user can also "Continue and exclude". |
| Switch method | User changes filters ↔ CSV | (If implemented) Confirm; current input cleared. |

---

## Step 4 – Preview Changes

**Purpose:** Show exactly what will change before submit.

### Working details

| Element | Behavior |
|--------|----------|
| Summary | "You are about to update **N** user(s)." and list of fields affected. |
| Sample table | Columns: User, ID, Field, Current, New. Shows up to 15 rows; "Showing 15 of N" if more. |
| Excluded (if any) | "M user(s) excluded due to validation errors" and "Download excluded list". |
| Back | Goes to Step 3. |
| Confirm and submit | Goes to Step 5. Disabled if effective user count is 0. |

### Edge cases

| Case | Trigger | UI behavior |
|------|--------|-------------|
| Zero users after exclusions | All rows had errors and user chose exclude | Confirm disabled; message: "No users to update. Go back to add more users or fix errors." |
| Large N | e.g. 500 users | Sample shows first 15; note that all changes apply on confirm. |

---

## Step 5 – Confirm & Submit

**Purpose:** Final confirmation and submit for approval.

### Working details

| Element | Behavior |
|--------|----------|
| Recap | User count and fields. Note that request goes to approval flow. |
| Checkbox | "I have reviewed the changes and confirm they are correct." Submit disabled until checked. |
| Cancel | Returns to Step 4. |
| Submit for approval | Submits request; shows success message with Request ID; stepper moves to Step 6; steps 1–5 become read-only. |

### Edge cases

| Case | Trigger | UI behavior |
|------|--------|-------------|
| Double-submit | User clicks Submit again | Button disabled after click (Submitting…). |
| Network failure | (Prototype: N/A) | In production: retry and error message. |

---

## Step 6 – Approval & Notify

**Purpose:** Show approval status and notify when done.

### Working details

| Element | Behavior |
|--------|----------|
| Pending | "Your bulk update is pending approval." Request ID, submitted by, date. Link to Edit History. |
| Approved | "Your bulk update has been approved and applied." "View in Edit History" goes to Step 7. |
| Rejected | "Your bulk update was rejected." Optional reason. "Edit and resubmit" can restart from Step 1. |
| Notify | (Documented only) In-app and/or email when status changes. |

### Edge cases

| Case | Trigger | UI behavior |
|------|--------|-------------|
| No approval workflow | Config says auto-apply | Skip to Applied and notify. |
| Rejected | Approver rejects | Show reason; offer Edit and resubmit. |

---

## Step 7 – Edit History

**Purpose:** Audit trail and optional reversal.

### Working details

| Element | Behavior |
|--------|----------|
| Table | Columns: Request ID, Submitted by, Date, User count, Fields changed, Status, Actions. |
| View details | Read-only summary of that request (users, fields, old → new). |
| Reverse | Shown only when status is Applied and reversal is supported. Opens confirm modal. |
| Confirm reverse | Reverts that request’s changes; creates a new "Reversal of #XXX" request. Original request marked Reversed. |
| Reverse N/A | Pending or unsupported type: Reverse hidden or disabled with tooltip. |

### Edge cases

| Case | Trigger | UI behavior |
|------|--------|-------------|
| Reversal not supported | e.g. certain field types | Reverse disabled; tooltip explains. |
| Already reversed | Request was reversed | Reverse hidden; "Reversed" label shown. |
| Reversal needs approval | Config | New reversal request goes to approval flow. |

---

## Screenshot checklist

- **Happy path:** One screenshot per step (1–7) with realistic data.
- **Step 1:** No users selected; filter returns 0 users; max users warning.
- **Step 2:** Inline validation errors (filters); CSV error modal with Download error CSV and Exclude vs Re-upload.
- **Step 3:** Validation summary with multiple errors.
- **Step 4:** Preview with "X users excluded".
- **Step 5:** Submit success; button disabled after submit.
- **Step 6:** Pending; Approved; Rejected.
- **Step 7:** Edit History list; View details; Reverse confirmation; Reversal not available.
- **Stepper:** All step states (not started, current, completed, post-submit locked).

---

## How to run the prototype

```bash
cd bulk-user-update-prototype
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Use the left stepper to move between steps. Complete Step 1 (add users), Step 2 (choose method and add edits or upload CSV), then proceed through Preview, Confirm, Submit. Use Step 6 "Simulate: Mark approved" or "Reject" to test approval states. Open Step 7 to see Edit History and Reverse.
