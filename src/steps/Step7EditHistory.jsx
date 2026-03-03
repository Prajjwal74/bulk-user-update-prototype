import { useState } from 'react';
import { useAppState } from '../context/AppState';

const MOCK_COMPENSATION = 100000;

const FIELD_KEY_MAP = {
  compensation: 'Compensation',
  title: 'Title',
  department: 'Department',
  currency: 'Pay Currency',
  status: 'Status',
  manager: 'Manager',
  employment_type: 'Employment Type',
  work_mode: 'Work Mode',
  cost_center: 'Cost Center',
  team: 'Team',
};

function computeFinalValue(original, edit) {
  const op = edit.operation;
  const val = edit.value;

  if (op === 'change_to') return val;
  if (op === 'clear') return '';
  if (op === 'append') return `${original} ${val}`;
  if (op === 'prepend') return `${val} ${original}`;

  const numOrig = parseFloat(String(original).replace(/[$,]/g, ''));
  const numVal = parseFloat(val);
  if (isNaN(numOrig) || isNaN(numVal)) return val;

  if (op === 'increase_by') return String(numOrig + numVal);
  if (op === 'decrease_by') return String(Math.max(0, numOrig - numVal));
  if (op === 'increase_pct') return String(Math.round(numOrig * (1 + numVal / 100)));
  if (op === 'decrease_pct') return String(Math.round(numOrig * (1 - numVal / 100)));
  if (op === 'promote') return original;
  if (op === 'demote') return original;

  return val || original;
}

function getOriginalValue(user, fieldId) {
  if (fieldId === 'compensation') return String(MOCK_COMPENSATION);
  if (fieldId === 'title') return user.role || 'Employee';
  if (fieldId === 'department') return user.department || '';
  return '';
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateChangeSheet(entry) {
  const users = entry.users || [];
  const edits = entry.fieldEdits || [];
  const method = entry.editMethod;
  const csvData = entry.parsedCsvData;

  if (method === 'csv' && csvData) {
    const { headers, rows } = csvData;
    const userLookup = new Map();
    users.forEach((u) => {
      userLookup.set(u.id, {
        'User ID': u.id, Name: u.name,
        Compensation: String(MOCK_COMPENSATION),
        Title: u.role || 'Employee',
        Department: u.department,
        Location: u.country || '',
      });
    });

    const changedRows = [];
    rows.forEach((cols) => {
      const userId = String(cols[0] || '').trim();
      const original = userLookup.get(userId);
      if (!original) return;
      const changedCols = new Set();
      headers.forEach((h, ci) => {
        if (h === 'User ID' || h === 'Name') return;
        const newVal = String(cols[ci] || '').trim();
        const oldVal = String(original[h] || '').trim();
        if (newVal && newVal !== oldVal) changedCols.add(ci);
      });
      if (changedCols.size > 0) changedRows.push({ cols, changedCols });
    });

    let html = '<html><head><meta charset="UTF-8"></head><body><table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px">';
    html += '<tr>' + headers.map((h) => `<th style="background:#f3f4f6;font-weight:bold;padding:6px 10px">${esc(h)}</th>`).join('') + '</tr>';
    changedRows.forEach(({ cols, changedCols }) => {
      html += '<tr>' + cols.map((c, ci) => {
        const style = changedCols.has(ci)
          ? 'background:#DBEAFE;color:#1E40AF;font-weight:600;padding:5px 10px'
          : 'padding:5px 10px';
        return `<td style="${style}">${esc(c)}</td>`;
      }).join('') + '</tr>';
    });
    html += '</table></body></html>';
    return html;
  }

  const allHeaders = ['User ID', 'Name', 'Department', 'Country'];
  const editFieldLabels = edits.map((e) => e.field);
  allHeaders.push(...editFieldLabels);

  const changedRows = [];
  users.forEach((u) => {
    const row = [u.id, u.name, u.department, u.country];
    const changedCols = new Set();
    edits.forEach((edit, ei) => {
      const orig = getOriginalValue(u, edit.fieldId);
      const final = computeFinalValue(orig, edit);
      row.push(final);
      changedCols.add(4 + ei);
    });
    if (changedCols.size > 0) changedRows.push({ row, changedCols });
  });

  let html = '<html><head><meta charset="UTF-8"></head><body><table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px">';
  html += '<tr>' + allHeaders.map((h) => `<th style="background:#f3f4f6;font-weight:bold;padding:6px 10px">${esc(h)}</th>`).join('') + '</tr>';
  changedRows.forEach(({ row, changedCols }) => {
    html += '<tr>' + row.map((c, ci) => {
      const style = changedCols.has(ci)
        ? 'background:#DBEAFE;color:#1E40AF;font-weight:600;padding:5px 10px'
        : 'padding:5px 10px';
      return `<td style="${style}">${esc(c)}</td>`;
    }).join('') + '</tr>';
  });
  html += '</table></body></html>';
  return html;
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const CRITICAL_IDS = ['compensation', 'currency', 'status'];
const CRITICAL_LABEL_KEYWORDS = ['compensation', 'pay currency', 'status'];

function hasCriticalChanges(entry) {
  if (entry.fieldEdits && entry.fieldEdits.length > 0) {
    return entry.fieldEdits.some((e) => CRITICAL_IDS.includes(e.fieldId));
  }
  const fields = (entry.fieldsChanged || '').toLowerCase();
  return CRITICAL_LABEL_KEYWORDS.some((kw) => fields.includes(kw));
}

function formatFieldsLabel(fieldsChanged) {
  if (!fieldsChanged || fieldsChanged === '—') return '—';
  const fields = fieldsChanged.split(',').map((f) => f.trim()).filter(Boolean);
  if (fields.length === 0) return '—';
  if (fields.length <= 2) return fields.join(', ');
  return `${fields.length} fields`;
}

export function Step7EditHistory() {
  const { history, setHistory, startNewBulkChange } = useAppState();
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [reverseSheet, setReverseSheet] = useState(null);

  const canReverse = (req) => (req.status === 'Applied' || req.status === 'Applied (Partial)') && !req.reversed;

  const handleDownload = (entry) => {
    const html = generateChangeSheet(entry);
    downloadFile(html, `${entry.requestId}_changes.xls`);
    setMenuOpenId(null);
  };

  const handleReverseClick = (entry) => {
    setMenuOpenId(null);
    if (hasCriticalChanges(entry)) {
      setReverseSheet({ id: entry.requestId, blocked: true });
    } else {
      setReverseSheet({ id: entry.requestId, blocked: false });
    }
  };

  const confirmReverse = () => {
    if (!reverseSheet || reverseSheet.blocked) return;
    const rid = reverseSheet.id;
    setHistory((prev) => {
      const target = prev.find((h) => h.requestId === rid);
      const updated = prev.map((h) =>
        h.requestId === rid ? { ...h, reversed: true, status: 'Reversed' } : h
      );
      return [
        ...updated,
        {
          requestId: `REV-${rid}`,
          submittedBy: 'Current User',
          date: new Date().toISOString(),
          userCount: target?.userCount || 0,
          fieldsChanged: target?.fieldsChanged || '—',
          status: 'Pending',
          statusDetail: `Reversal of ${rid}`,
        },
      ];
    });
    setReverseSheet(null);
  };

  const closeSheet = () => setReverseSheet(null);

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  return (
    <>
      <header className="step-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="step-title">Bulk Edit History</h1>
          <p className="step-description">
            Audit trail of all bulk update requests.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={startNewBulkChange}
          style={{ flexShrink: 0 }}
        >
          + New Bulk Change
        </button>
      </header>

      <div className="card" style={{ marginBottom: '1rem' }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--text-muted)' }}>No bulk update requests yet.</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click "New Bulk Change" to get started.</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ overflow: 'visible' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Request ID</th>
                  <th>Created by</th>
                  <th>Date</th>
                  <th>Users</th>
                  <th>Fields Edited</th>
                  <th>Status</th>
                  <th style={{ width: '48px' }}></th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => {
                  const reversible = canReverse(h);
                  const isMenuOpen = menuOpenId === h.requestId;
                  return (
                    <tr key={h.requestId}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{h.requestId}</td>
                      <td style={{ fontSize: '0.85rem' }}>{h.submittedBy}</td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(h.date).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.85rem' }}>{h.userCount}</td>
                      <td style={{ fontSize: '0.85rem' }}>{formatFieldsLabel(h.fieldsChanged)}</td>
                      <td>
                        <span
                          className={`badge ${
                            h.status === 'Applied' || h.status === 'Applied (Partial)' ? 'badge--success'
                              : h.status === 'Rejected' || h.status === 'Reversed' || h.status === 'Cancelled' ? 'badge--danger'
                              : h.status === 'Scheduled' || h.status === 'Scheduled – Pending Approval' ? 'badge--scheduled'
                              : 'badge--muted'
                          }`}
                        >
                          {h.status === 'Scheduled – Pending Approval' ? 'Pending Approval' : h.status}
                        </span>
                        {(h.status === 'Scheduled' || h.status === 'Scheduled – Pending Approval') && h.scheduledDate && (
                          <div style={{ fontSize: '0.72rem', color: '#7C3AED', marginTop: '0.2rem', whiteSpace: 'nowrap' }}>
                            📅 {new Date(h.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </td>
                      <td style={{ position: 'relative', overflow: 'visible' }}>
                        <button
                          type="button"
                          onClick={(e) => toggleMenu(h.requestId, e)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '1.2rem', lineHeight: 1, padding: '0.35rem 0.5rem',
                            color: 'var(--text-muted)', borderRadius: '4px',
                            position: 'relative', zIndex: 1,
                          }}
                          title="Actions"
                        >
                          ⋮
                        </button>
                        {isMenuOpen && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpenId(null)} />
                            <div style={{
                              position: 'absolute', right: 0, top: '-0.35rem', zIndex: 100,
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                              minWidth: '160px', overflow: 'hidden',
                            }}>
                              <button
                                type="button"
                                onClick={() => handleDownload(h)}
                                style={{
                                  display: 'block', width: '100%', textAlign: 'left',
                                  background: 'none', border: 'none', padding: '0.55rem 0.85rem',
                                  fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text)',
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'var(--bg)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'none'; }}
                              >
                                Download changes
                              </button>
                              {reversible && (
                                <button
                                  type="button"
                                  onClick={() => handleReverseClick(h)}
                                  style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    background: 'none', border: 'none', padding: '0.55rem 0.85rem',
                                    fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text)',
                                  }}
                                  onMouseEnter={(e) => { e.target.style.background = 'var(--bg)'; }}
                                  onMouseLeave={(e) => { e.target.style.background = 'none'; }}
                                >
                                  Reverse
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reverseSheet && (
        <div className="modal-overlay" onClick={closeSheet}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: reverseSheet.blocked ? '#DC2626' : 'var(--text)' }}>
                {reverseSheet.blocked ? 'Reversal Not Allowed' : 'Confirm Reversal'}
              </h3>
              <button
                type="button"
                onClick={closeSheet}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.15rem 0.25rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {reverseSheet.blocked ? (
              <>
                <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Request <strong style={{ fontFamily: 'monospace' }}>{reverseSheet.id}</strong> modified critical fields (e.g. Compensation, Pay Currency, Status).
                </p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Changes to sensitive fields cannot be reversed through bulk actions. Please contact your HR admin to process this manually.
                </p>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeSheet}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  This will revert all changes from request <strong style={{ fontFamily: 'monospace' }}>{reverseSheet.id}</strong> to their previous values.
                </p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  A new reversal request will be created and applied.
                </p>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeSheet}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmReverse}>
                    Confirm reversal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
