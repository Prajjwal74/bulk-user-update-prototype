import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, 'screenshots');
const pptx = new PptxGenJS();

pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Prajjwal Agarwal';
pptx.title = 'Bulk User Information Update — Case Study';

const DARK = '0F172A';
const BLUE = '2563EB';
const WHITE = 'FFFFFF';
const TEXT = '1E293B';
const MUTED = '64748B';
const RED = 'DC2626';
const GREEN = '059669';
const PURPLE = '7C3AED';
const AMBER = 'D97706';
const LIGHT_BG = 'F8FAFC';

const imgPath = (name) => path.join(SHOTS, name);

// ============= SLIDE 1: Title =============
let s = pptx.addSlide();
s.background = { fill: DARK };
s.addText('PRODUCT CASE STUDY', { x: 0.8, y: 1.5, w: 10, fontSize: 12, color: '60A5FA', fontFace: 'Arial', bold: true, charSpacing: 4 });
s.addText('Bulk User Information\nUpdate', { x: 0.8, y: 2.0, w: 10, fontSize: 40, color: WHITE, fontFace: 'Arial', bold: true, lineSpacingMultiple: 1.1 });
s.addText('Enabling administrators to modify attributes across dozens to hundreds of employees at once — with validation, approval workflows, scheduling, and downstream propagation.', { x: 0.8, y: 4.0, w: 8, fontSize: 14, color: '94A3B8', fontFace: 'Arial', lineSpacingMultiple: 1.4 });
// Tags
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 5.5, w: 1.7, h: 0.35, fill: { color: '1E3A5F' }, rectRadius: 0.15 });
s.addText('Working Prototype', { x: 0.8, y: 5.5, w: 1.7, h: 0.35, fontSize: 9, color: '60A5FA', fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 2.7, y: 5.5, w: 1.5, h: 0.35, fill: { color: '064E3B' }, rectRadius: 0.15 });
s.addText('20+ Edge Cases', { x: 2.7, y: 5.5, w: 1.5, h: 0.35, fontSize: 9, color: '34D399', fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 4.4, y: 5.5, w: 1.8, h: 0.35, fill: { color: '3B1F6E' }, rectRadius: 0.15 });
s.addText('Data Propagation', { x: 4.4, y: 5.5, w: 1.8, h: 0.35, fontSize: 9, color: 'A78BFA', fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });

// ============= SLIDE 2: Approach =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addText('QUESTION 1 — APPROACH', { x: 0.6, y: 0.4, w: 10, fontSize: 10, color: BLUE, fontFace: 'Arial', bold: true, charSpacing: 3 });
s.addText('Three Approaches Evaluated', { x: 0.6, y: 0.75, w: 10, fontSize: 28, color: TEXT, fontFace: 'Arial', bold: true });

const approaches = [
  { x: 0.6, title: 'Option A: Spreadsheet-Only', desc: 'Download CSV → edit offline → re-upload.', pros: ['Handles per-user values', 'Familiar Excel workflow'], cons: ['Error-prone', 'No real-time validation', 'Bad for uniform changes'], chosen: false },
  { x: 4.6, title: 'Option B: Filter + Rules Only', desc: 'Select via filters → apply uniform operations.', pros: ['Fast for uniform changes', 'In-app validation'], cons: ["Can't handle per-user values", "Doesn't scale for mixed changes"], chosen: false },
  { x: 8.6, title: '✓ Hybrid: Both Methods', desc: 'User picks the best tool within one flow.', pros: ['Best of both worlds', 'All use cases covered', 'Flexible for any size'], cons: ['More complex to build'], chosen: true },
];

approaches.forEach((a) => {
  const fill = a.chosen ? 'EFF6FF' : LIGHT_BG;
  const border = a.chosen ? { color: BLUE, pt: 2 } : { color: 'E2E8F0', pt: 1 };
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: a.x, y: 1.4, w: 3.7, h: 4.5, fill: { color: fill }, line: border, rectRadius: 0.1 });
  s.addText(a.title, { x: a.x + 0.2, y: 1.6, w: 3.3, fontSize: 13, color: TEXT, fontFace: 'Arial', bold: true });
  s.addText(a.desc, { x: a.x + 0.2, y: 2.05, w: 3.3, fontSize: 10, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.3 });
  s.addText('✓ Pros', { x: a.x + 0.2, y: 2.7, w: 3.3, fontSize: 9, color: GREEN, fontFace: 'Arial', bold: true });
  a.pros.forEach((p, i) => {
    s.addText('• ' + p, { x: a.x + 0.3, y: 2.95 + i * 0.25, w: 3.2, fontSize: 9, color: TEXT, fontFace: 'Arial' });
  });
  const consY = 2.95 + a.pros.length * 0.25 + 0.15;
  s.addText('✕ Cons', { x: a.x + 0.2, y: consY, w: 3.3, fontSize: 9, color: RED, fontFace: 'Arial', bold: true });
  a.cons.forEach((c, i) => {
    s.addText('• ' + c, { x: a.x + 0.3, y: consY + 0.25 + i * 0.25, w: 3.2, fontSize: 9, color: TEXT, fontFace: 'Arial' });
  });
});

s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 6.1, w: 11.8, h: 0.65, fill: { color: 'EFF6FF' }, line: { color: BLUE, pt: 1, dashType: 'solid' }, rectRadius: 0.08 });
s.addText('Why Hybrid: Uniform changes ("give all L3s a 5% raise") → filters. Per-user changes ("each person gets different comp") → CSV. One wizard, two paths.', { x: 0.8, y: 6.15, w: 11.4, fontSize: 10, color: TEXT, fontFace: 'Arial', lineSpacingMultiple: 1.3 });

// ============= SLIDE 3: Flow Overview =============
s = pptx.addSlide();
s.background = { fill: BLUE };
s.addText('QUESTION 2 — PRODUCT FLOW', { x: 0, y: 1.8, w: 13.33, fontSize: 10, color: 'C0C8D0', fontFace: 'Arial', bold: true, align: 'center', charSpacing: 4 });
s.addText('Flow Walkthrough', { x: 0, y: 2.3, w: 13.33, fontSize: 38, color: WHITE, fontFace: 'Arial', bold: true, align: 'center' });
s.addText('A guided 4-step wizard: Select Users → Define Changes → Preview & Submit → Status', { x: 0, y: 3.3, w: 13.33, fontSize: 14, color: 'D0D8E0', fontFace: 'Arial', align: 'center' });

const steps = ['📋 Edit History', '👥 Select Users', '✏️ Define Changes', '👁️ Preview', '✅ Status'];
const totalW = steps.length * 2.0 + (steps.length - 1) * 0.3;
let startX = (13.33 - totalW) / 2;
steps.forEach((st, i) => {
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: startX + i * 2.3, y: 4.5, w: 2.0, h: 0.5, fill: { color: '3B82F6' }, line: { color: '6DA3F0', pt: 1 }, rectRadius: 0.08 });
  s.addText(st, { x: startX + i * 2.3, y: 4.5, w: 2.0, h: 0.5, fontSize: 10, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
  if (i < steps.length - 1) {
    s.addText('→', { x: startX + i * 2.3 + 2.0, y: 4.5, w: 0.3, h: 0.5, fontSize: 14, color: '8AB4F8', fontFace: 'Arial', align: 'center', valign: 'middle' });
  }
});

// ============= SLIDE 4: Step 1 - User Selection =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.4, w: 0.75, h: 0.32, fill: { color: BLUE }, rectRadius: 0.12 });
s.addText('Step 1', { x: 0.6, y: 0.4, w: 0.75, h: 0.32, fontSize: 9, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
s.addText('Select Users', { x: 1.5, y: 0.35, w: 5, fontSize: 24, color: TEXT, fontFace: 'Arial', bold: true });

s.addImage({ path: imgPath('02-user-selection.png'), x: 0.4, y: 1.0, w: 5.5, h: 3.4, rounding: true });
s.addImage({ path: imgPath('03-search-results.png'), x: 0.4, y: 4.5, w: 5.5, h: 2.5, rounding: true });

s.addText('Two Methods', { x: 6.3, y: 1.0, w: 6, fontSize: 14, color: TEXT, fontFace: 'Arial', bold: true });
s.addText('• Search by name, ID, role, or country\n• Filter by Country, Department, Role (with L1/L2/L3 hierarchy)\n• Combined AND-logic filters\n• Individual add or bulk add from filter results', { x: 6.3, y: 1.4, w: 6.3, fontSize: 10, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.6 });

s.addText('Edge Cases', { x: 6.3, y: 3.3, w: 6, fontSize: 14, color: RED, fontFace: 'Arial', bold: true });
s.addText('! Max 500 users — hard limit with warning\n✓ Duplicate prevention — "Already added" inline\n✓ Smart CTA — disables when all filtered users already selected\n✓ Filters persist after applying — not cleared\n✓ Empty states for no search results / no filter matches', { x: 6.3, y: 3.7, w: 6.3, fontSize: 10, color: TEXT, fontFace: 'Arial', lineSpacingMultiple: 1.6 });

// ============= SLIDE 5: Step 2 - Define Changes =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.4, w: 0.75, h: 0.32, fill: { color: BLUE }, rectRadius: 0.12 });
s.addText('Step 2', { x: 0.6, y: 0.4, w: 0.75, h: 0.32, fontSize: 9, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
s.addText('Define Changes', { x: 1.5, y: 0.35, w: 5, fontSize: 24, color: TEXT, fontFace: 'Arial', bold: true });

s.addText('Method A: Filter + Rules', { x: 0.5, y: 0.95, w: 6, fontSize: 11, color: MUTED, fontFace: 'Arial' });
s.addImage({ path: imgPath('09-title-added.png'), x: 0.4, y: 1.3, w: 5.8, h: 3.5, rounding: true });
s.addText('12 fields · 10 operations · Sensitive fields flagged', { x: 0.5, y: 4.85, w: 6, fontSize: 9, color: MUTED, fontFace: 'Arial' });

s.addText('Method B: CSV Upload', { x: 6.5, y: 0.95, w: 6, fontSize: 11, color: MUTED, fontFace: 'Arial' });
s.addImage({ path: imgPath('10-csv-tab.png'), x: 6.4, y: 1.3, w: 5.8, h: 3.5, rounding: true });

s.addText('Edge Cases', { x: 0.5, y: 5.2, w: 6, fontSize: 13, color: RED, fontFace: 'Arial', bold: true });
s.addText('⚠ Currency conflict — blocks absolute ops for mixed currencies\n⚠ Duplicate field — warns when same field added again\n! File size: 5 MB max · Format: .csv/.xls/.xlsx only\n✓ Partial CSV errors — continue with valid rows, exclude bad\n✓ Auto-strips "Errors" column on corrected re-upload', { x: 0.5, y: 5.55, w: 12, fontSize: 10, color: TEXT, fontFace: 'Arial', lineSpacingMultiple: 1.5 });

// ============= SLIDE 6: CSV Details =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addText('CSV WORKFLOW', { x: 0.6, y: 0.4, w: 10, fontSize: 10, color: BLUE, fontFace: 'Arial', bold: true, charSpacing: 3 });
s.addText('Template → Upload → Validate → Error Handling', { x: 0.6, y: 0.75, w: 10, fontSize: 24, color: TEXT, fontFace: 'Arial', bold: true });

// Left column
s.addText('📥 Template Download', { x: 0.6, y: 1.5, w: 5, fontSize: 13, color: TEXT, fontFace: 'Arial', bold: true });
s.addText('Pre-filled with selected users. Headers: User ID, Name, Compensation, Title, Department, Location.', { x: 0.6, y: 1.85, w: 5.5, fontSize: 10, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.4 });

s.addText('❌ Error Sheet', { x: 0.6, y: 2.55, w: 5, fontSize: 13, color: TEXT, fontFace: 'Arial', bold: true });
s.addText('"Errors" column prepended · Red/green color coding · Download as .xls', { x: 0.6, y: 2.9, w: 5.5, fontSize: 10, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.4 });

s.addText('✅ Final Change Sheet', { x: 0.6, y: 3.5, w: 5, fontSize: 13, color: TEXT, fontFace: 'Arial', bold: true });
s.addText('Only rows with actual changes · Modified cells highlighted yellow · Available from Edit History', { x: 0.6, y: 3.85, w: 5.5, fontSize: 10, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.4 });

// Right column - Validation
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 1.5, w: 5.5, h: 2.5, fill: { color: LIGHT_BG }, line: { color: RED, pt: 1 }, rectRadius: 0.08 });
s.addText('Validation Rules', { x: 7.0, y: 1.6, w: 5, fontSize: 12, color: RED, fontFace: 'Arial', bold: true });
s.addText('• Headers must match template exactly\n• User ID: non-empty, must exist in selected users\n• Compensation: valid positive number\n• Required: Name, Title, Department, Location\n• Max file size: 5 MB\n• Format: .csv, .xls, .xlsx only', { x: 7.0, y: 2.0, w: 5, fontSize: 10, color: TEXT, fontFace: 'Arial', lineSpacingMultiple: 1.5 });

s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 4.2, w: 5.5, h: 1.6, fill: { color: LIGHT_BG }, line: { color: BLUE, pt: 1 }, rectRadius: 0.08 });
s.addText('Recovery Options', { x: 7.0, y: 4.3, w: 5, fontSize: 12, color: BLUE, fontFace: 'Arial', bold: true });
s.addText('• "Continue with N valid rows" — excludes errors\n• "Download error sheet" — for offline correction\n• "Re-upload corrected" — auto-strips Errors column', { x: 7.0, y: 4.65, w: 5, fontSize: 10, color: TEXT, fontFace: 'Arial', lineSpacingMultiple: 1.5 });

// ============= SLIDE 7: Step 3a - Preview Review =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.4, w: 0.85, h: 0.32, fill: { color: BLUE }, rectRadius: 0.12 });
s.addText('Step 3a', { x: 0.6, y: 0.4, w: 0.85, h: 0.32, fontSize: 9, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
s.addText('Preview — Review Changes', { x: 1.6, y: 0.35, w: 8, fontSize: 24, color: TEXT, fontFace: 'Arial', bold: true });

s.addImage({ path: imgPath('11-preview-review.png'), x: 0.4, y: 1.0, w: 6.5, h: 5.5, rounding: true });

s.addText("What's Shown", { x: 7.2, y: 1.0, w: 5.5, fontSize: 14, color: TEXT, fontFace: 'Arial', bold: true });
s.addText('• Impact stats: users affected, fields changed, countries, excluded\n• Fields table: each field, operation, value\n• "Sensitive" badge on critical fields\n• Expandable per-user change preview (old → new)', { x: 7.2, y: 1.5, w: 5.5, fontSize: 10.5, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.7 });

s.addText('Edge Cases', { x: 7.2, y: 3.5, w: 5.5, fontSize: 13, color: RED, fontFace: 'Arial', bold: true });
s.addText('! Zero edits in filter mode → redirects to Step 2\n! Zero users after exclusions → submit disabled\n! CSV with no changes → "No field changes detected"', { x: 7.2, y: 3.9, w: 5.5, fontSize: 10.5, color: TEXT, fontFace: 'Arial', lineSpacingMultiple: 1.6 });

// ============= SLIDE 8: Step 3b - Impact & Submit =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.4, w: 0.85, h: 0.32, fill: { color: BLUE }, rectRadius: 0.12 });
s.addText('Step 3b', { x: 0.6, y: 0.4, w: 0.85, h: 0.32, fontSize: 9, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
s.addText('Impact & Submit', { x: 1.6, y: 0.35, w: 8, fontSize: 24, color: TEXT, fontFace: 'Arial', bold: true });

s.addImage({ path: imgPath('12-preview-impact.png'), x: 0.4, y: 1.0, w: 5.5, h: 3.0, rounding: true });
s.addImage({ path: imgPath('14-confirm-ready.png'), x: 0.4, y: 4.2, w: 5.5, h: 3.0, rounding: true });

s.addText('Affected Systems ⚠', { x: 6.3, y: 1.0, w: 6, fontSize: 14, color: RED, fontFace: 'Arial', bold: true });
s.addText('Field → system mapping shows exactly which downstream systems will sync after changes.', { x: 6.3, y: 1.4, w: 6, fontSize: 10, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.4 });

const systems = [
  { name: '💰 Payroll', c: 'EFF6FF', tc: '1E40AF' },
  { name: '🏥 Benefits', c: 'EFF6FF', tc: '1E40AF' },
  { name: '💻 Devices', c: 'EFF6FF', tc: '1E40AF' },
  { name: '💬 Slack', c: 'F5F3FF', tc: '5B21B6' },
  { name: '📧 Google', c: 'F5F3FF', tc: '5B21B6' },
  { name: '🐙 GitHub', c: 'F5F3FF', tc: '5B21B6' },
];
systems.forEach((sys, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.3 + col * 2.0, y: 2.1 + row * 0.45, w: 1.8, h: 0.35, fill: { color: sys.c }, rectRadius: 0.06 });
  s.addText(sys.name, { x: 6.3 + col * 2.0, y: 2.1 + row * 0.45, w: 1.8, h: 0.35, fontSize: 9, color: sys.tc, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
});

s.addText('Confirmation Modal', { x: 6.3, y: 3.3, w: 6, fontSize: 14, color: TEXT, fontFace: 'Arial', bold: true });
s.addText('• User count + sensitive field warning\n• 📅 Schedule button — pick future date\n• Checkbox confirmation required\n• CTA: "Submit for approval" / "Apply" / "Schedule"\n\nScheduling never bypasses approval.\nSensitive fields → approval required regardless.', { x: 6.3, y: 3.7, w: 6, fontSize: 10, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.5 });

// ============= SLIDE 9: Step 4 - Approval =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.4, w: 0.75, h: 0.32, fill: { color: BLUE }, rectRadius: 0.12 });
s.addText('Step 4', { x: 0.6, y: 0.4, w: 0.75, h: 0.32, fontSize: 9, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
s.addText('Approval & Application', { x: 1.5, y: 0.35, w: 8, fontSize: 24, color: TEXT, fontFace: 'Arial', bold: true });

s.addImage({ path: imgPath('15-approval-status.png'), x: 0.4, y: 1.0, w: 5.5, h: 3.0, rounding: true });
s.addImage({ path: imgPath('17-final-status.png'), x: 0.4, y: 4.2, w: 5.5, h: 3.0, rounding: true });

// Matrix
s.addText('Decision Matrix', { x: 6.3, y: 1.0, w: 6, fontSize: 14, color: TEXT, fontFace: 'Arial', bold: true });
const matrixData = [
  ['Sensitive?', 'Scheduled?', 'Result'],
  ['No', 'No', 'Apply immediately'],
  ['No', 'Yes', 'Scheduled'],
  ['Yes', 'No', 'Pending approval'],
  ['Yes', 'Yes', 'Sched + Pending'],
];
const tableRows = matrixData.map((row, ri) => row.map(cell => ({
  text: cell,
  options: {
    fontSize: 9, fontFace: 'Arial', fill: { color: ri === 0 ? 'F1F5F9' : WHITE },
    bold: ri === 0, color: ri === 0 ? MUTED : TEXT,
    border: { type: 'solid', color: 'E2E8F0', pt: 0.5 },
  }
})));
s.addTable(tableRows, { x: 6.3, y: 1.4, w: 6.0, colW: [1.5, 1.5, 3.0] });

s.addText('Edge Cases', { x: 6.3, y: 3.4, w: 6, fontSize: 13, color: RED, fontFace: 'Arial', bold: true });
s.addText('⚠ Partial failure — ~15% fail. Retry or continue without.\n✓ Cancel mid-processing — stops, no changes applied\n✓ Failed count resets on retry\n! Reversal blocked for sensitive fields (comp, currency, status)', { x: 6.3, y: 3.8, w: 6, fontSize: 10, color: TEXT, fontFace: 'Arial', lineSpacingMultiple: 1.6 });

// ============= SLIDE 10: Edit History =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.4, w: 0.85, h: 0.32, fill: { color: BLUE }, rectRadius: 0.12 });
s.addText('Home', { x: 0.6, y: 0.4, w: 0.85, h: 0.32, fontSize: 9, color: WHITE, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
s.addText('Edit History — Audit Trail', { x: 1.6, y: 0.35, w: 8, fontSize: 24, color: TEXT, fontFace: 'Arial', bold: true });

s.addImage({ path: imgPath('18-history-entry.png'), x: 0.4, y: 1.0, w: 7.0, h: 3.0, rounding: true });

s.addText('Features', { x: 7.8, y: 1.0, w: 5, fontSize: 14, color: TEXT, fontFace: 'Arial', bold: true });
s.addText('• Full table: Request ID, Created By, Date, Users, Fields, Status\n• 📥 Download change sheet — styled .xls, changed cells highlighted\n• ↩️ Reverse changes — blocked for sensitive fields\n• + New Bulk Change — resets, starts fresh', { x: 7.8, y: 1.5, w: 5, fontSize: 10.5, color: MUTED, fontFace: 'Arial', lineSpacingMultiple: 1.6 });

s.addText('Status Badges', { x: 7.8, y: 3.5, w: 5, fontSize: 12, color: TEXT, fontFace: 'Arial', bold: true });
const badges = [
  { t: 'Applied', c: GREEN }, { t: 'Partial', c: GREEN }, { t: 'Pending', c: AMBER },
  { t: 'Scheduled', c: PURPLE }, { t: 'Rejected', c: RED }, { t: 'Cancelled', c: RED },
];
badges.forEach((b, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 7.8 + col * 1.5, y: 3.85 + row * 0.4, w: 1.3, h: 0.3, fill: { color: LIGHT_BG }, rectRadius: 0.12 });
  s.addText(b.t, { x: 7.8 + col * 1.5, y: 3.85 + row * 0.4, w: 1.3, h: 0.3, fontSize: 8, color: b.c, fontFace: 'Arial', bold: true, align: 'center', valign: 'middle' });
});

// ============= SLIDE 11: Data Propagation =============
s = pptx.addSlide();
s.background = { fill: DARK };
s.addText('QUESTION 3', { x: 0.6, y: 0.4, w: 10, fontSize: 10, color: '60A5FA', fontFace: 'Arial', bold: true, charSpacing: 3 });
s.addText('Data Propagation Challenges & Solutions', { x: 0.6, y: 0.8, w: 10, fontSize: 26, color: WHITE, fontFace: 'Arial', bold: true });

// Challenges
s.addText('Challenges', { x: 0.6, y: 1.7, w: 5, fontSize: 14, color: 'F87171', fontFace: 'Arial', bold: true });
const challenges = [
  { t: '1. Atomicity', d: 'Comp change must hit Payroll AND Benefits. Partial sync = compliance risk.' },
  { t: '2. Rate Limiting', d: '500 users × 3 integrations = 1,500+ API calls. Limits cause delays.' },
  { t: '3. Ordering', d: 'Status: Payroll before Devices. Bulk amplifies dependency complexity.' },
  { t: '4. API Outages', d: "GitHub down shouldn't block everything. Partial propagation = inconsistency." },
];
challenges.forEach((ch, i) => {
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 2.1 + i * 1.15, w: 5.8, h: 0.95, fill: { color: '1E293B' }, line: { color: '334155', pt: 0.5 }, rectRadius: 0.08 });
  s.addText(ch.t, { x: 0.8, y: 2.15 + i * 1.15, w: 5.4, fontSize: 11, color: WHITE, fontFace: 'Arial', bold: true });
  s.addText(ch.d, { x: 0.8, y: 2.4 + i * 1.15, w: 5.4, fontSize: 9.5, color: '94A3B8', fontFace: 'Arial', lineSpacingMultiple: 1.3 });
});

// Solutions
s.addText('Solutions', { x: 6.8, y: 1.7, w: 5, fontSize: 14, color: '34D399', fontFace: 'Arial', bold: true });
const solutions = [
  { t: '🔄 Async Job Queue + Retry', d: 'Each sync = independent job. Exponential backoff. Decouples core from propagation.' },
  { t: '🔀 Dependency Graph (DAG)', d: 'Process in topological order. Parent fails → child syncs held.' },
  { t: '🛡️ Idempotent Operations', d: 'Every sync safe to retry. Change-request-ID for deduplication.' },
  { t: '📅 Scheduling as Buffer', d: 'Batch during off-peak. Reduces rate-limit pressure. Lands before payroll cut-offs.' },
];
solutions.forEach((sl, i) => {
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.8, y: 2.1 + i * 1.15, w: 5.8, h: 0.95, fill: { color: '1E293B' }, line: { color: '334155', pt: 0.5 }, rectRadius: 0.08 });
  s.addText(sl.t, { x: 7.0, y: 2.15 + i * 1.15, w: 5.4, fontSize: 11, color: WHITE, fontFace: 'Arial', bold: true });
  s.addText(sl.d, { x: 7.0, y: 2.4 + i * 1.15, w: 5.4, fontSize: 9.5, color: '94A3B8', fontFace: 'Arial', lineSpacingMultiple: 1.3 });
});

// ============= SLIDE 12: Impact Matrix =============
s = pptx.addSlide();
s.background = { fill: WHITE };
s.addText('QUESTION 3 — CONTINUED', { x: 0.6, y: 0.4, w: 10, fontSize: 10, color: BLUE, fontFace: 'Arial', bold: true, charSpacing: 3 });
s.addText('Field → System Impact Matrix', { x: 0.6, y: 0.8, w: 10, fontSize: 26, color: TEXT, fontFace: 'Arial', bold: true });
s.addText('This mapping drives the "Affected Systems" preview shown to admins before submit.', { x: 0.6, y: 1.35, w: 10, fontSize: 11, color: MUTED, fontFace: 'Arial' });

const impactRows = [
  ['Field', 'First-Party Systems', 'Third-Party', 'Risk'],
  ['Compensation', 'Payroll, Benefits', '—', 'High'],
  ['Status', 'Payroll, Benefits, Devices', 'Slack, Google, GitHub', 'High'],
  ['Title', '—', 'Slack, Google, GitHub', 'Low'],
  ['Department', 'Cost Center', 'Slack, Google', 'Medium'],
  ['Location', 'Payroll, Benefits, Devices', '—', 'Medium'],
  ['Manager / Team', '—', 'Slack, Google', 'Low'],
  ['Work Mode', 'Devices', '—', 'Low'],
];

const impactTable = impactRows.map((row, ri) => row.map((cell, ci) => {
  const riskColor = cell === 'High' ? RED : cell === 'Medium' ? AMBER : cell === 'Low' ? GREEN : (ri === 0 ? MUTED : TEXT);
  return {
    text: cell,
    options: {
      fontSize: 10, fontFace: 'Arial',
      fill: { color: ri === 0 ? 'F1F5F9' : (ri % 2 === 0 ? LIGHT_BG : WHITE) },
      bold: ri === 0 || ci === 0 || ci === 3,
      color: ci === 3 && ri > 0 ? riskColor : (ri === 0 ? MUTED : TEXT),
      border: { type: 'solid', color: 'E2E8F0', pt: 0.5 },
    }
  };
}));
s.addTable(impactTable, { x: 0.6, y: 1.8, w: 12.0, colW: [2.0, 3.5, 3.5, 1.2] });

s.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.5, w: 12, h: 0.7, fill: { color: 'EFF6FF' }, line: { color: BLUE, pt: 1 }, rectRadius: 0.08 });
s.addText('Why this matters: Admins see exactly which systems are affected before submitting. They can schedule for off-hours if many critical systems are involved.', { x: 0.8, y: 5.55, w: 11.6, fontSize: 10.5, color: TEXT, fontFace: 'Arial', lineSpacingMultiple: 1.3 });

// ============= SLIDE 13: Summary =============
s = pptx.addSlide();
s.background = { fill: DARK };
s.addText('SUMMARY', { x: 0.8, y: 1.2, w: 10, fontSize: 10, color: '60A5FA', fontFace: 'Arial', bold: true, charSpacing: 4 });
s.addText('Key Takeaways', { x: 0.8, y: 1.6, w: 10, fontSize: 36, color: WHITE, fontFace: 'Arial', bold: true });

const takeaways = [
  { icon: '🔀', title: 'Hybrid Approach', desc: 'Filter + Rules & CSV. One flow, two paths.' },
  { icon: '🛡️', title: 'Smart Approval', desc: 'Only sensitive fields need approval. Scheduling never bypasses it.' },
  { icon: '⚠️', title: '20+ Edge Cases', desc: 'Currency conflicts, partial failures, file validation, cancellation.' },
  { icon: '🔗', title: 'Propagation Aware', desc: 'Field → system mapping. Async queues, retry, dependency ordering.' },
  { icon: '📅', title: 'Scheduling', desc: 'Future dates. Off-peak processing. Approval + schedule independent.' },
  { icon: '📋', title: 'Full Audit Trail', desc: 'Every request tracked. Change sheets. Reversals with guardrails.' },
];

takeaways.forEach((t, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 6;
  const y = 2.8 + row * 1.2;
  s.addText(t.icon, { x, y, w: 0.5, fontSize: 18, fontFace: 'Arial' });
  s.addText(t.title, { x: x + 0.6, y, w: 5, fontSize: 14, color: '60A5FA', fontFace: 'Arial', bold: true });
  s.addText(t.desc, { x: x + 0.6, y: y + 0.35, w: 5, fontSize: 10.5, color: '94A3B8', fontFace: 'Arial', lineSpacingMultiple: 1.3 });
});

s.addShape(pptx.shapes.LINE, { x: 0.8, y: 6.4, w: 11.5, h: 0, line: { color: '334155', width: 0.5 } });
s.addText('Working prototype available for live demo →', { x: 0.8, y: 6.6, w: 10, fontSize: 12, color: '94A3B8', fontFace: 'Arial' });

// ============= SAVE =============
const outPath = path.join(__dirname, 'Bulk_User_Update_Case_Study.pptx');
await pptx.writeFile({ fileName: outPath });
console.log('✓ Saved to', outPath);
