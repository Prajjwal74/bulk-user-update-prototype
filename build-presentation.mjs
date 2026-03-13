import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const b64 = JSON.parse(fs.readFileSync(path.join(__dirname, 'screenshots', 'b64.json'), 'utf-8'));

// Prefer PNGs in screenshots/ when present (so re-captured screenshots override b64.json)
const screenshotsDir = path.join(__dirname, 'screenshots');
if (fs.existsSync(screenshotsDir)) {
  for (const f of fs.readdirSync(screenshotsDir)) {
    if (!/\.png$/i.test(f) || f.startsWith('.')) continue;
    const fullPath = path.join(screenshotsDir, f);
    if (!fs.statSync(fullPath).isFile()) continue;
    try {
      const buf = fs.readFileSync(fullPath);
      b64[f] = 'data:image/png;base64,' + buf.toString('base64');
    } catch (_) {}
  }
}

const bulkDir = path.join(__dirname, 'screenshots', 'bulk-upload');
if (fs.existsSync(bulkDir)) {
  for (const f of fs.readdirSync(bulkDir)) {
    if (!/\.png$/i.test(f)) continue;
    const key = f.replace(/\.png$/i, '').replace(/\s+/g, '_').replace(/&/g, '_').replace(/[()]/g, '');
    const buf = fs.readFileSync(path.join(bulkDir, f));
    b64[key] = 'data:image/png;base64,' + buf.toString('base64');
  }
}
const img = (name) => b64[name] || '';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Bulk User Update — Case Study</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0F172A;overflow:hidden;height:100vh}
.slide{position:absolute;inset:0;display:none;flex-direction:column;overflow-y:auto;padding:2.5rem 4rem}
.slide.active{display:flex}
.slide.light{background:#fff;color:#1E293B}
.slide.dark{background:linear-gradient(135deg,#0F172A,#1E293B);color:#F1F5F9}
.slide.blue{background:linear-gradient(135deg,#1E40AF,#2563EB);color:#fff}

h1{font-size:2.4rem;font-weight:700;line-height:1.2;margin-bottom:0.6rem}
h2{font-size:1.8rem;font-weight:700;margin-bottom:0.5rem}
h3{font-size:1.15rem;font-weight:600;margin-bottom:0.3rem}
p,.desc{line-height:1.6;font-size:0.95rem}
.muted{color:#94A3B8}
.light .muted{color:#64748B}
.tag{display:inline-block;padding:0.15rem 0.55rem;border-radius:99px;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.04em}
.tag-blue{background:#EFF6FF;color:#2563EB}
.tag-red{background:#FEF2F2;color:#DC2626}
.tag-green{background:#ECFDF5;color:#059669}
.tag-purple{background:#F5F3FF;color:#7C3AED}
.tag-amber{background:#FFFBEB;color:#D97706}

.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem}
.card{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:1rem}
.dark .card{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1)}
.card h4{font-size:0.95rem;margin-bottom:0.3rem}
.card p,.card li{font-size:0.85rem}
ul{padding-left:1.1rem}
li{margin-bottom:0.25rem;font-size:0.88rem;line-height:1.5}

.screen{border-radius:8px;border:1px solid #E2E8F0;max-width:100%;height:auto;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
.screen-wrap{text-align:center;margin:0.75rem 0}
.screen-sm{max-height:380px;object-fit:contain}
.screen-md{max-height:440px;object-fit:contain}

.edge{display:flex;align-items:flex-start;gap:0.5rem;padding:0.4rem 0;border-bottom:1px solid #E2E8F0;font-size:0.84rem}
.edge:last-child{border:none}
.edge-icon{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;flex-shrink:0}
.e-warn{background:#FEF3C7;color:#92400E}
.e-block{background:#FEE2E2;color:#991B1B}
.e-ok{background:#D1FAE5;color:#065F46}

.approach{border-radius:10px;padding:1.2rem;border:2px solid #E2E8F0;height:100%}
.approach.chosen{border-color:#2563EB;background:#EFF6FF}
.pro-con{display:flex;gap:0.75rem;margin-top:0.5rem}
.pro-con>div{flex:1}
.pro-con h5{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.2rem}
.pro-con li{font-size:0.78rem;margin-bottom:0.15rem}
.pros h5{color:#059669}.cons h5{color:#DC2626}

.pill{display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.6rem;border-radius:5px;font-size:0.78rem;font-weight:500}
.pill-b{background:#EFF6FF;color:#1E40AF;border-left:3px solid #3B82F6}
.pill-p{background:#F5F3FF;color:#5B21B6;border-left:3px solid #8B5CF6}

table.dt{width:100%;border-collapse:collapse;font-size:0.82rem;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden}
table.dt th{background:#F1F5F9;text-align:left;padding:0.45rem 0.6rem;font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.03em;color:#64748B;border-bottom:1px solid #E2E8F0}
table.dt td{padding:0.4rem 0.6rem;border-bottom:1px solid #E2E8F0;vertical-align:top}
table.dt tr:last-child td{border:none}

.step-badge{display:inline-flex;align-items:center;gap:0.35rem;padding:0.25rem 0.7rem;border-radius:99px;font-size:0.78rem;font-weight:600;background:#2563EB;color:#fff}
.label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:#60A5FA;font-weight:700;margin-bottom:0.4rem}
.light .label{color:#2563EB}

.nav{position:fixed;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:0.6rem 2rem;background:rgba(15,23,42,0.95);backdrop-filter:blur(8px);z-index:200;border-top:1px solid rgba(255,255,255,0.1)}
.nav button{padding:0.4rem 1rem;border-radius:6px;font-size:0.82rem;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff}
.nav button:hover{background:rgba(255,255,255,0.2)}
.nav button:disabled{opacity:0.3;cursor:default}
.nav .pg{color:rgba(255,255,255,0.5);font-size:0.82rem}

.mt-1{margin-top:0.6rem}.mt-2{margin-top:1.2rem}.mb-1{margin-bottom:0.6rem}.mb-2{margin-bottom:1.2rem}
.spacer{flex:1}

@media print{.nav{display:none}.slide{position:relative;display:flex!important;page-break-after:always;min-height:100vh}}
</style>
</head>
<body>
<div id="deck">

<!-- S1: Title -->
<div class="slide dark active">
<div style="flex:1;display:flex;flex-direction:column;justify-content:center">
<p class="label">Product Case Study</p>
<h1 style="font-size:2.8rem">Bulk User Information Update</h1>
<p style="font-size:1.1rem;color:#94A3B8;max-width:650px;margin-top:0.5rem">Enabling administrators to modify attributes across dozens to hundreds of employees at once — with validation, approval workflows, scheduling, and downstream propagation.</p>
<div style="margin-top:2rem;display:flex;gap:0.5rem;flex-wrap:wrap">
<span class="tag tag-blue">Working Prototype</span>
<span class="tag tag-green">20+ Edge Cases</span>
<span class="tag tag-purple">Data Propagation</span>
</div>
</div>
</div>

<!-- S2: Approach -->
<div class="slide light">
<p class="label">Question 1 — Approach</p>
<h2>Three Approaches Evaluated</h2>
<div class="grid-3 mt-1">
<div class="approach">
<span class="tag tag-amber mb-1" style="display:inline-block">Option A</span>
<h3>Spreadsheet-Only</h3>
<p class="muted" style="font-size:0.84rem">Download CSV → edit offline → re-upload.</p>
<div class="pro-con"><div class="pros"><h5>✓ Pros</h5><ul><li>Handles per-user values</li><li>Familiar Excel workflow</li></ul></div><div class="cons"><h5>✕ Cons</h5><ul><li>Error-prone</li><li>No real-time validation</li><li>Bad for uniform changes</li></ul></div></div>
</div>
<div class="approach">
<span class="tag tag-amber mb-1" style="display:inline-block">Option B</span>
<h3>Filter + Rules Only</h3>
<p class="muted" style="font-size:0.84rem">Select via filters → apply uniform operations.</p>
<div class="pro-con"><div class="pros"><h5>✓ Pros</h5><ul><li>Fast for uniform changes</li><li>In-app validation</li></ul></div><div class="cons"><h5>✕ Cons</h5><ul><li>Can't handle per-user values</li><li>Doesn't scale for mixed changes</li></ul></div></div>
</div>
<div class="approach chosen">
<span class="tag tag-blue mb-1" style="display:inline-block">✓ Chosen</span>
<h3>Hybrid: Both Methods</h3>
<p class="muted" style="font-size:0.84rem">User picks the best tool for their use case within one flow.</p>
<div class="pro-con"><div class="pros"><h5>✓ Pros</h5><ul><li>Best of both worlds</li><li>All use cases covered</li><li>Flexible for any batch size</li></ul></div><div class="cons"><h5>✕ Cons</h5><ul><li>More complex to build</li></ul></div></div>
</div>
</div>
<div class="card mt-2" style="border-left:4px solid #2563EB;max-width:100%">
<p style="font-size:0.88rem"><strong>Why Hybrid:</strong> One flow, two ways to edit. <strong>Filters</strong> = same change for many people (e.g. 5% raise for all L3s). <strong>CSV</strong> = different value per person (e.g. each employee’s new comp). Pick the one that fits; the rest stays simple.</p>
</div>
</div>

<!-- S3: Flow Overview -->
<div class="slide blue">
<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
<p style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;opacity:0.7;margin-bottom:0.75rem">Question 2 — Product Flow</p>
<h1 style="font-size:2.6rem">Flow Walkthrough</h1>
<p style="font-size:1rem;color:rgba(255,255,255,0.75);max-width:550px;margin-top:0.5rem">A guided 4-step wizard: Select Users → Define Changes → Preview & Submit → Status</p>
<div style="display:flex;gap:0.5rem;margin-top:2rem;flex-wrap:wrap;justify-content:center">
${['📋 Edit History','👥 Select Users','✏️ Define Changes','👁️ Preview','✅ Status'].map(t=>`<div style="padding:0.45rem 0.9rem;border-radius:8px;font-size:0.82rem;font-weight:600;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25)">${t}</div>`).join('<span style="color:rgba(255,255,255,0.4);font-size:1.1rem">→</span>')}
</div>
</div>
</div>

<!-- S4: Step 1 - User Selection -->
<div class="slide light">
<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem">
<span class="step-badge">Step 1</span><h2 style="margin:0">Select Users</h2>
</div>
<div class="grid-2">
<div>
<div class="screen-wrap"><img class="screen screen-md" src="${img('02-user-selection.png')}"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('03-search-results.png')}"/></div>
</div>
<div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('05-filters-tab.png')}"/></div>
<h3 class="mt-1">Edge Cases</h3>
<div class="edge"><span class="edge-icon e-ok">✓</span><div><strong>Duplicate prevention</strong> — "Already added" inline</div></div>
<div class="edge"><span class="edge-icon e-ok">✓</span><div><strong>Smart CTA</strong> — disables when all filtered users already selected</div></div>
<div class="edge"><span class="edge-icon e-ok">✓</span><div><strong>Filters persist</strong> after applying — not cleared</div></div>
</div>
</div>
</div>

<!-- S5: Step 2 - Define Changes -->
<div class="slide light">
<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem">
<span class="step-badge">Step 2</span><h2 style="margin:0">Define Changes</h2>
</div>
<div class="grid-2">
<div>
<p class="muted mb-1">Method A: Filter + Rules — apply uniform operations.</p>
<div class="screen-wrap"><img class="screen screen-md" src="${img('09-title-added.png')}"/></div>
<p class="muted mt-1" style="font-size:0.82rem">12 fields · 10 operations · Sensitive fields flagged (Compensation, Currency, Status)</p>
</div>
<div>
<p class="muted mb-1">Method B: CSV Upload — per-user values.</p>
<div class="screen-wrap"><img class="screen screen-md" src="${img('10-csv-tab.png')}"/></div>
<h3 class="mt-1">Edge Cases</h3>
<div class="edge"><span class="edge-icon e-warn">⚠</span><div><strong>Currency conflict</strong> — blocks absolute ops for mixed currencies</div></div>
<div class="edge"><span class="edge-icon e-warn">⚠</span><div><strong>Duplicate field</strong> — warns when same field added again</div></div>
<div class="edge"><span class="edge-icon e-block">!</span><div><strong>File size</strong> — 5 MB max · format: .csv/.xls/.xlsx only</div></div>
<div class="edge"><span class="edge-icon e-ok">✓</span><div><strong>Partial CSV errors</strong> — continue with valid rows, exclude bad ones</div></div>
<div class="edge"><span class="edge-icon e-ok">✓</span><div><strong>Auto-strips "Errors" column</strong> on corrected re-upload</div></div>
</div>
</div>
</div>

<!-- S6: CSV Details -->
<div class="slide light">
<p class="label">CSV Workflow</p>
<h2>Template → Upload → Validate → Error Handling</h2>
<div class="grid-2 mt-1">
<div>
<h3>📥 Template Download</h3>
<p class="muted" style="font-size:0.84rem">Pre-filled with selected users. Headers: User ID, Name, Compensation, Title, Department, Location.</p>
<h3 class="mt-1">❌ Error Sheet</h3>
<p class="muted" style="font-size:0.84rem">"Errors" column prepended · Red/green color coding · Download as .xls</p>
<h3 class="mt-1">✅ Final Change Sheet</h3>
<p class="muted" style="font-size:0.84rem">Only rows with changes · Modified cells highlighted yellow · Available from Edit History</p>
</div>
<div>
<h3>Validation Rules</h3>
<div class="card" style="border-left:4px solid #DC2626">
<ul>
<li><strong>Headers:</strong> must match template exactly</li>
<li><strong>User ID:</strong> non-empty, must exist in selected users</li>
<li><strong>Compensation:</strong> valid positive number</li>
<li><strong>Required fields:</strong> Name, Title, Dept, Location</li>
<li><strong>File size:</strong> max 5 MB</li>
<li><strong>Format:</strong> .csv, .xls, .xlsx only</li>
</ul>
</div>
<h3 class="mt-1">Recovery Options</h3>
<div class="card" style="border-left:4px solid #2563EB">
<ul>
<li>"Continue with N valid rows" — excludes errors</li>
<li>"Download error sheet" — for offline correction</li>
<li>"Re-upload corrected" — auto-strips Errors column</li>
</ul>
</div>
</div>
</div>
</div>

<!-- S7: Step 3 - Preview (Phase 1) -->
<div class="slide light">
<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem">
<span class="step-badge">Step 3a</span><h2 style="margin:0">Preview — Review Changes</h2>
</div>
<div class="grid-2">
<div>
<div class="screen-wrap"><img class="screen" src="${img('11-preview-review.png')}"/></div>
</div>
<div>
<h3>What's Shown</h3>
<ul>
<li><strong>Impact stats:</strong> users affected, fields changed, countries, excluded</li>
<li><strong>Fields table:</strong> each field, operation, value · "Sensitive" badge on critical fields</li>
<li><strong>Per-user preview:</strong> expandable old → new values for each user</li>
</ul>
<h3 class="mt-1">Edge Cases</h3>
<div class="edge"><span class="edge-icon e-block">!</span><div><strong>Zero edits</strong> — redirects back to Step 2</div></div>
<div class="edge"><span class="edge-icon e-block">!</span><div><strong>Zero users after exclusions</strong> — submit disabled</div></div>
</div>
</div>
</div>

<!-- S8: Step 3 - Preview (Phase 2) -->
<div class="slide light">
<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem">
<span class="step-badge">Step 3b</span><h2 style="margin:0">Preview — Impact & Submit</h2>
</div>
<div class="grid-2">
<div>
<div class="screen-wrap"><img class="screen" src="${img('12-preview-impact.png')}"/></div>
<div class="screen-wrap"><img class="screen" src="${img('13-confirm-modal.png')}"/></div>
</div>
<div>
<h3>Affected Systems ⚠</h3>
<p class="muted" style="font-size:0.84rem">Field → system mapping shows exactly which downstream systems will sync.</p>
<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin:0.5rem 0">
<span class="pill pill-b">💰 Payroll</span><span class="pill pill-b">🏥 Benefits</span><span class="pill pill-b">💻 Devices</span>
<span class="pill pill-p">💬 Slack</span><span class="pill pill-p">📧 Google</span><span class="pill pill-p">🐙 GitHub</span>
</div>
<h3 class="mt-1">Confirmation Modal</h3>
<ul>
<li>User count + sensitive field warning</li>
<li>📅 Schedule button — pick future date</li>
<li>Checkbox confirmation required</li>
<li>Dynamic CTA: "Submit for approval" / "Apply" / "Schedule"</li>
</ul>
<h3 class="mt-1">Scheduling</h3>
<p class="muted" style="font-size:0.84rem"><strong>Scheduling never bypasses approval.</strong> If sensitive fields → approval required regardless of date.</p>
</div>
</div>
</div>

<!-- S9: Step 4 - Approval -->
<div class="slide light">
<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem">
<span class="step-badge">Step 4</span><h2 style="margin:0">Approval & Application</h2>
</div>
<div class="grid-2">
<div>
<div class="screen-wrap"><img class="screen screen-md" src="${img('15-approval-status.png')}"/></div>
<div class="screen-wrap"><img class="screen screen-md" src="${img('17-final-status.png')}"/></div>
</div>
<div>
<h3>Four Paths</h3>
<table class="dt">
<thead><tr><th>Sensitive?</th><th>Scheduled?</th><th>Result</th></tr></thead>
<tbody>
<tr><td>No</td><td>No</td><td><span class="tag tag-green">Apply immediately</span></td></tr>
<tr><td>No</td><td>Yes</td><td><span class="tag tag-purple">Scheduled</span></td></tr>
<tr><td>Yes</td><td>No</td><td><span class="tag tag-amber">Pending approval</span></td></tr>
<tr><td>Yes</td><td>Yes</td><td><span class="tag tag-purple">Sched + Pending</span></td></tr>
</tbody>
</table>
<h3 class="mt-1">Edge Cases</h3>
<div class="edge"><span class="edge-icon e-warn">⚠</span><div><strong>Partial failure</strong> — ~15% fail. Retry or continue without.</div></div>
<div class="edge"><span class="edge-icon e-ok">✓</span><div><strong>Cancel mid-processing</strong> — stops immediately, no changes applied</div></div>
<div class="edge"><span class="edge-icon e-ok">✓</span><div><strong>Failed count resets</strong> on retry</div></div>
<div class="edge"><span class="edge-icon e-block">!</span><div><strong>Reversal blocked</strong> for sensitive fields (comp, currency, status)</div></div>
</div>
</div>
</div>

<!-- S10: Edit History -->
<div class="slide light">
<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem">
<span class="step-badge">Home</span><h2 style="margin:0">Edit History — Audit Trail</h2>
</div>
<div class="grid-2">
<div>
<div class="screen-wrap"><img class="screen" src="${img('18-history-entry.png')}"/></div>
</div>
<div>
<h3>Features</h3>
<ul>
<li>Full table: Request ID, Created By, Date, Users, Fields, Status</li>
<li><strong>📥 Download change sheet</strong> — styled .xls, only changed rows, cells highlighted</li>
<li><strong>↩️ Reverse changes</strong> — blocked for sensitive fields</li>
<li><strong>+ New Bulk Change</strong> — resets and starts fresh</li>
</ul>
<h3 class="mt-1">Status Badges</h3>
<div style="display:flex;flex-wrap:wrap;gap:0.35rem">
<span class="tag tag-green">Applied</span>
<span class="tag tag-green">Partial</span>
<span class="tag tag-amber">Pending</span>
<span class="tag tag-purple">Scheduled</span>
<span class="tag tag-red">Rejected</span>
<span class="tag tag-red">Cancelled</span>
</div>
</div>
</div>
</div>

<!-- S11: Error Handling & CSV -->
<div class="slide light">
<p class="label">Screenshots — Error Handling & CSV</p>
<h2>User & Field Selection CSV Validation</h2>
<div class="grid-2 mt-1">
<div>
<h3 class="mb-1">User upload (Step 1)</h3>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Upload_Users_CSV_Validation_Failure')}" alt="User CSV validation failure"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Upload_Users_CSV_Error_Sheet')}" alt="User CSV error sheet"/></div>
</div>
<div>
<h3 class="mb-1">Field Selection & Edit CSV</h3>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Field_Selection___Edit_CSV_-_Validation_Failure')}" alt="Field CSV validation failure"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Field_Selection___Edit_CSV_Upload_Error_CSv')}" alt="Field CSV error sheet"/></div>
</div>
</div>
<div class="grid-3 mt-1">
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Field_Selection___Edit_CSV_-_Download_Sample')}" alt="Download sample"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Field_Selection___Edit_Error_1')}" alt="Error 1"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Field_Selection___Edit_Error_2')}" alt="Error 2"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Field_Selection___Edit_Nudge_1')}" alt="Nudge"/></div>
</div>
<p class="muted mt-1" style="font-size:0.82rem">Download sample template, validation failures, error sheet (Errors column + red cells), and inline errors/nudges.</p>
</div>

<!-- S12: Preview & Approval States -->
<div class="slide light">
<p class="label">Screenshots — Preview & Approval</p>
<h2>Preview Changes & Approval Flows</h2>
<div class="grid-3 mt-1">
<div><div class="screen-wrap"><img class="screen screen-sm" src="${img('Preview_Changes_-_Rules')}" alt="Preview Rules"/></div><p class="muted" style="font-size:0.75rem;text-align:center">Preview — Rules</p></div>
<div><div class="screen-wrap"><img class="screen screen-sm" src="${img('Preview_Changes_-_CSV_Upload')}" alt="Preview CSV"/></div><p class="muted" style="font-size:0.75rem;text-align:center">Preview — CSV</p></div>
<div><div class="screen-wrap"><img class="screen screen-sm" src="${img('Preview_Changes_-_Affected_Systems')}" alt="Affected Systems"/></div><p class="muted" style="font-size:0.75rem;text-align:center">Affected Systems</p></div>
</div>
<div class="grid-3 mt-1">
<div><div class="screen-wrap"><img class="screen screen-sm" src="${img('Submit_for_Approval')}" alt="Submit"/></div><p class="muted" style="font-size:0.75rem;text-align:center">Submit for approval</p></div>
<div><div class="screen-wrap"><img class="screen screen-sm" src="${img('Approval_Not_Needed')}" alt="Approval not needed"/></div><p class="muted" style="font-size:0.75rem;text-align:center">Approval not needed</p></div>
<div><div class="screen-wrap"><img class="screen screen-sm" src="${img('Partial_Approval')}" alt="Partial approval"/></div><p class="muted" style="font-size:0.75rem;text-align:center">Partial approval</p></div>
</div>
</div>

<!-- S13: Scheduling, History & Reverse -->
<div class="slide light">
<p class="label">Screenshots — Status & Actions</p>
<h2>Scheduling, Edit History & Reverse</h2>
<div class="grid-2 mt-1">
<div>
<h3 class="mb-1">Scheduling</h3>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Scheduled_Changes')}" alt="Scheduled"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Scheduled___pending_Approval')}" alt="Scheduled pending approval"/></div>
</div>
<div>
<h3 class="mb-1">Edit History & Reverse</h3>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Bulk_Edit_History')}" alt="Bulk Edit History"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Reverse___download_action')}" alt="Reverse and download"/></div>
<div class="screen-wrap"><img class="screen screen-sm" src="${img('Reverse_Not_Allowed')}" alt="Reverse not allowed"/></div>
</div>
</div>

<!-- S14: Data Propagation -->
<div class="slide dark">
<div style="min-height:70vh">
<p class="label">Question 3</p>
<h2>Data Propagation Challenges & Solutions</h2>
<div class="grid-2 mt-1">
<div>
<h3 style="color:#F87171">Challenges</h3>
<div class="card mb-1"><h4>1. Atomicity</h4><p>Comp change must hit Payroll AND Benefits together. Partial sync = compliance risk.</p></div>
<div class="card mb-1"><h4>2. Rate Limiting</h4><p>500 users × 3 integrations = 1,500+ API calls. Third-party limits cause sync delays.</p></div>
<div class="card mb-1"><h4>3. Ordering</h4><p>Status changes: Payroll before Device Management. Bulk amplifies dependency complexity.</p></div>
<div class="card"><h4>4. API Outages</h4><p>GitHub down shouldn't block the entire change. But partial propagation creates inconsistency.</p></div>
</div>
<div>
<h3 style="color:#34D399">Solutions</h3>
<div class="card mb-1"><h4>🔄 Async Job Queue + Retry</h4><p>Each downstream sync = independent job. Exponential backoff. Decouples core change from propagation.</p></div>
<div class="card mb-1"><h4>🔀 Dependency Graph (DAG)</h4><p>Process in topological order. Parent fails → child syncs held.</p></div>
<div class="card mb-1"><h4>🛡️ Idempotent Operations</h4><p>Every sync safe to retry. Change-request-ID for deduplication.</p></div>
<div class="card"><h4>📅 Scheduling as Buffer</h4><p>Batch during off-peak hours. Reduces rate-limit pressure. Lands before payroll cut-offs.</p></div>
</div>
</div>
</div>
</div>

<!-- S15: System Impact Matrix -->
<div class="slide light">
<div style="flex:1;min-height:0;display:flex;flex-direction:column;overflow-y:auto">
<p class="label">Question 3 — Continued</p>
<h2>Field → System Impact Matrix</h2>
<p class="muted mb-1">This mapping drives the "Affected Systems" preview shown to admins before submit.</p>
<table class="dt">
<thead><tr><th>Field</th><th>First-Party</th><th>Third-Party</th><th>Risk</th></tr></thead>
<tbody>
<tr><td><strong>Compensation</strong></td><td><span class="pill pill-b">Payroll</span> <span class="pill pill-b">Benefits</span></td><td>—</td><td><span class="tag tag-red">High</span></td></tr>
<tr><td><strong>Status</strong></td><td><span class="pill pill-b">Payroll</span> <span class="pill pill-b">Benefits</span> <span class="pill pill-b">Devices</span></td><td><span class="pill pill-p">Slack</span> <span class="pill pill-p">Google</span> <span class="pill pill-p">GitHub</span></td><td><span class="tag tag-red">High</span></td></tr>
<tr><td><strong>Title</strong></td><td>—</td><td><span class="pill pill-p">Slack</span> <span class="pill pill-p">Google</span> <span class="pill pill-p">GitHub</span></td><td><span class="tag tag-green">Low</span></td></tr>
<tr><td><strong>Department</strong></td><td><span class="pill pill-b">Cost Center</span></td><td><span class="pill pill-p">Slack</span> <span class="pill pill-p">Google</span></td><td><span class="tag tag-amber">Med</span></td></tr>
<tr><td><strong>Location</strong></td><td><span class="pill pill-b">Payroll</span> <span class="pill pill-b">Benefits</span> <span class="pill pill-b">Devices</span></td><td>—</td><td><span class="tag tag-amber">Med</span></td></tr>
<tr><td><strong>Manager / Team</strong></td><td>—</td><td><span class="pill pill-p">Slack</span> <span class="pill pill-p">Google</span></td><td><span class="tag tag-green">Low</span></td></tr>
</tbody>
</table>
<div class="card mt-1" style="border-left:4px solid #2563EB">
<p style="font-size:0.88rem"><strong>Why this matters:</strong> Admins see exactly which systems are affected before submitting. They can schedule for off-hours if many critical systems are involved.</p>
</div>
</div>
</div>

<!-- S16: Summary -->
<div class="slide dark">
<div style="flex:1;display:flex;flex-direction:column;justify-content:center">
<p class="label">Summary</p>
<h1 style="font-size:2.4rem;margin-bottom:1.5rem">Key Takeaways</h1>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;max-width:850px">
<div style="display:flex;gap:0.6rem"><span style="font-size:1.3rem">🔀</span><div><h3 style="color:#60A5FA;margin-bottom:0.15rem">Hybrid Approach</h3><p style="font-size:0.85rem;color:#94A3B8">Filter + Rules & CSV. One flow, two paths.</p></div></div>
<div style="display:flex;gap:0.6rem"><span style="font-size:1.3rem">🛡️</span><div><h3 style="color:#60A5FA;margin-bottom:0.15rem">Smart Approval</h3><p style="font-size:0.85rem;color:#94A3B8">Only sensitive fields need approval. Scheduling never bypasses it.</p></div></div>
<div style="display:flex;gap:0.6rem"><span style="font-size:1.3rem">⚠️</span><div><h3 style="color:#60A5FA;margin-bottom:0.15rem">20+ Edge Cases</h3><p style="font-size:0.85rem;color:#94A3B8">Currency conflicts, partial failures, file validation, cancellation.</p></div></div>
<div style="display:flex;gap:0.6rem"><span style="font-size:1.3rem">🔗</span><div><h3 style="color:#60A5FA;margin-bottom:0.15rem">Propagation Aware</h3><p style="font-size:0.85rem;color:#94A3B8">Field → system mapping. Async queues, retry, dependency ordering.</p></div></div>
<div style="display:flex;gap:0.6rem"><span style="font-size:1.3rem">📅</span><div><h3 style="color:#60A5FA;margin-bottom:0.15rem">Scheduling</h3><p style="font-size:0.85rem;color:#94A3B8">Future dates. Off-peak processing. Approval + schedule independent.</p></div></div>
<div style="display:flex;gap:0.6rem"><span style="font-size:1.3rem">📋</span><div><h3 style="color:#60A5FA;margin-bottom:0.15rem">Full Audit Trail</h3><p style="font-size:0.85rem;color:#94A3B8">Every request tracked. Change sheets. Reversals with guardrails.</p></div></div>
</div>
<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.1)">
<p style="font-size:1rem;color:#94A3B8">Working prototype available for live demo →</p>
</div>
</div>
</div>
</div>

</div>

<div class="nav">
<button id="pb" onclick="go(-1)" disabled>← Prev</button>
<span class="pg" id="pg">1 / 16</span>
<button id="nb" onclick="go(1)">Next →</button>
</div>
<script>
const sl=document.querySelectorAll('.slide');let c=0;
function show(i){sl.forEach(s=>s.classList.remove('active'));sl[i].classList.add('active');c=i;document.getElementById('pg').textContent=(i+1)+' / '+sl.length;document.getElementById('pb').disabled=i===0;document.getElementById('nb').disabled=i===sl.length-1}
function go(d){const n=c+d;if(n>=0&&n<sl.length)show(n)}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();go(1)}if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}});
show(0);
</script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'presentation.html'), html);
console.log('Presentation built! 16 slides (incl. Bulk Upload Screenshots).');
