import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5175';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(10000);
  const w = (ms) => new Promise(r => setTimeout(r, ms));
  const s = async (name) => {
    await page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
    console.log('✓', name);
  };

  // --- STEP 0: Edit History ---
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await w(800);
  await s('01-edit-history-empty.png');

  // --- STEP 1: User Selection ---
  await page.getByRole('button', { name: '+ New Bulk Change' }).click();
  await w(800);
  await s('02-user-selection.png');

  // Search and add users
  await page.getByPlaceholder('Type name or ID').fill('Al');
  await w(500);
  await s('03-search-results.png');

  // Add available users
  let addBtn = page.getByRole('button', { name: 'Add', exact: true }).first();
  if (await addBtn.isVisible()) { await addBtn.click(); await w(300); }

  for (const q of ['Bo', 'Ca', 'Da', 'Ev', 'Fr', 'Gr', 'Ha', 'Iv']) {
    await page.getByPlaceholder('Type name or ID').fill(q);
    await w(400);
    addBtn = page.getByRole('button', { name: 'Add', exact: true }).first();
    try { if (await addBtn.isVisible({ timeout: 500 })) { await addBtn.click(); await w(200); } } catch {}
  }

  await page.getByPlaceholder('Type name or ID').fill('');
  await w(300);
  await s('04-users-selected.png');

  // Filters
  await page.getByRole('tab', { name: 'Filters' }).click();
  await w(600);
  await s('05-filters-tab.png');

  // Apply
  try {
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await w(400);
    const addAll = page.getByRole('button', { name: /Add.*user/ }).first();
    if (await addAll.isVisible({ timeout: 1000 })) { await addAll.click(); await w(400); }
  } catch {}
  await s('06-filters-result.png');

  // Go to Step 2
  await page.getByRole('button', { name: 'Continue to Field Selection' }).click();
  await w(1000);
  await s('07-field-selection.png');

  // Debug: log what's on the page
  const pageContent = await page.content();
  const hasSelect = pageContent.includes('<select');
  console.log('  [debug] page has <select>:', hasSelect);

  // --- STEP 2: Add fields ---
  // Use page.locator with CSS
  const allSelects = page.locator('select');
  const selectCount = await allSelects.count();
  console.log('  [debug] select count:', selectCount);

  // Ensure filters mode is active
  if (selectCount === 0) {
    await page.locator('input[name="editMethod"][type="radio"]').first().check({ force: true });
    await w(800);
    console.log('  [debug] toggled radio, selects now:', await page.locator('select').count());
  }

  // Now add Compensation
  const sels = page.locator('select');
  await sels.nth(0).selectOption('compensation');
  await w(500);
  // After selecting compensation, the ops dropdown updates
  const opSel = page.locator('select').nth(1);
  await opSel.selectOption('change_to');
  await w(500);
  // Value input should now be visible
  const valInputs = page.locator('input[type="text"]:not([id="user-search"]):not([type="date"])');
  const vc = await valInputs.count();
  console.log('  [debug] value inputs:', vc);
  if (vc > 0) {
    await valInputs.last().fill('120000');
    await w(300);
  }
  // Force click even if "disabled" — the button should be enabled now
  const addBtn2 = page.getByRole('button', { name: 'Add change' });
  const isEnabled = await addBtn2.isEnabled();
  console.log('  [debug] Add change enabled:', isEnabled);
  if (isEnabled) {
    await addBtn2.click();
  } else {
    await addBtn2.click({ force: true });
  }
  await w(500);
  await s('08-comp-added.png');

  // Add Title
  const sels2 = page.locator('select');
  await sels2.nth(0).selectOption('title');
  await w(300);
  await sels2.nth(1).selectOption({ index: 1 });
  await w(300);
  const inp2 = page.locator('input[type="text"]:not([id="user-search"])');
  if (await inp2.count() > 0) {
    await inp2.last().fill('Senior Engineer');
    await w(200);
  }
  await page.getByRole('button', { name: 'Add change' }).click();
  await w(500);
  await s('09-title-added.png');

  // CSV tab
  const csvLabel = page.getByText('Edit by CSV upload');
  if (await csvLabel.isVisible()) {
    await csvLabel.click();
    await w(600);
    await s('10-csv-tab.png');
    await page.getByText('Edit by filters & rules').click();
    await w(400);
  }

  // --- STEP 3: Preview ---
  await page.getByRole('button', { name: 'Preview changes' }).click();
  await w(1000);
  await s('11-preview-review.png');

  await page.getByRole('button', { name: 'Continue' }).click();
  await w(800);
  await s('12-preview-impact.png');

  // Open confirm modal
  const submitBtn = page.getByRole('button', { name: /Submit for approval|Confirm and apply/ }).first();
  await submitBtn.click();
  await w(600);
  await s('13-confirm-modal.png');

  // Check & submit
  await page.locator('.modal-content input[type="checkbox"]').check();
  await w(300);
  await s('14-confirm-ready.png');

  const modalSubmit = page.locator('.modal-content').getByRole('button', { name: /Submit for approval|Apply changes/ });
  await modalSubmit.click();
  await w(1500);

  // --- STEP 4: Approval ---
  await s('15-approval-status.png');

  const approveBtn = page.getByRole('button', { name: 'Mark as approved' });
  if (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await approveBtn.click();
    await w(2000);
    await s('16-processing.png');
  }

  await w(8000);
  await s('17-final-status.png');

  // History
  const histBtn = page.getByRole('button', { name: 'View Edit History' });
  if (await histBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await histBtn.click();
    await w(800);
  }
  await s('18-history-entry.png');

  await browser.close();
  console.log('\nDone!');
}

run().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
