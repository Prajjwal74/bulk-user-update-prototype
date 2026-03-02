# Bulk User Information Update – Prototype (Desktop)

Rippling-style bulk employee attribute update flow: select users, choose fields and edits (filters or CSV), validate, preview, confirm, submit for approval, and view/edit history with optional reversal.

## Run the prototype

```bash
npm install
npm run dev
```

Open the URL in the browser (e.g. http://localhost:5173). Use the left stepper to move between steps.

## Flow summary

1. **User Selection** – Search by name/ID or add by filters (Country, Role, Department). Build a list of up to 500 users.
2. **Field Selection & Edit** – Choose "Edit by filters & rules" or "Edit by CSV upload". Add field changes (e.g. Compensation, Title) with operations (change to, increase/decrease by amount or %), or upload a CSV template.
3. **Validation & Errors** – Review validation/format errors, fix in place, re-upload CSV, or continue excluding error rows.
4. **Preview Changes** – Summary of user count, fields, and sample table of changes.
5. **Confirm & Submit** – Confirm checkbox and submit for approval.
6. **Approval & Notify** – Pending/Approved/Rejected. Use "Simulate: Mark approved" or "Reject" to test.
7. **Edit History** – List of requests; View details; Reverse (when applicable).

## Documentation

- **[docs/DESIGN_FLOW.md](docs/DESIGN_FLOW.md)** – Design flow, working details per screen, and edge cases.
- **Screenshots** – Capture from the running app per [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md).

## Tech

- React 19 + Vite 7. No router; single-page flow with context state.
