import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from '../context/AppState';

const OP_LABELS = {
  change_to: 'Change to',
  increase_by: 'Increase by (amount)',
  decrease_by: 'Decrease by (amount)',
  increase_pct: 'Increase by (%)',
  decrease_pct: 'Decrease by (%)',
  append: 'Append',
  prepend: 'Prepend',
  promote: 'Promote (+1 level)',
  demote: 'Demote (−1 level)',
  clear: 'Clear value',
  add_to: 'Add to',
  remove_from: 'Remove from',
};

const SENSITIVE_FIELDS = ['compensation', 'currency', 'status'];
const SENSITIVE_LABELS = ['Compensation', 'Pay Currency', 'Status'];

const MOCK_COMPENSATION = 100000;

function getOriginalValue(user, fieldId) {
  if (fieldId === 'compensation') return String(MOCK_COMPENSATION);
  if (fieldId === 'title') return user.role || 'Employee';
  if (fieldId === 'department') return user.department || '';
  if (fieldId === 'location') return user.country || '';
  return '';
}

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
  return val || original;
}

const SYSTEM_IMPACT_MAP = {
  compensation: ['Payroll', 'Benefits & Insurance'],
  currency: ['Payroll'],
  title: ['Slack', 'Google Workspace', 'GitHub'],
  department: ['Slack', 'Google Workspace', 'Cost Center Reporting'],
  location: ['Payroll', 'Benefits & Insurance', 'Device Management'],
  level: ['Google Workspace', 'Cost Center Reporting'],
  manager: ['Slack', 'Google Workspace'],
  status: ['Payroll', 'Benefits & Insurance', 'Device Management', 'Slack', 'Google Workspace', 'GitHub'],
  employment_type: ['Payroll', 'Benefits & Insurance'],
  work_mode: ['Device Management'],
  cost_center: ['Cost Center Reporting'],
  team: ['Slack', 'Google Workspace'],
};

const SYSTEM_ICONS = {
  'Payroll': '💰',
  'Benefits & Insurance': '🏥',
  'Slack': '💬',
  'Google Workspace': '📧',
  'GitHub': '🐙',
  'Device Management': '💻',
  'Cost Center Reporting': '📊',
};

export function Step4Preview() {
  const {
    selectedUsers,
    excludedUserIds,
    fieldEdits,
    editMethod,
    effectiveUserCount,
    parsedCsvData,
    confirmChecked,
    setConfirmChecked,
    submitForApproval,
    goToStep,
    CRITICAL_FIELDS,
    CRITICAL_LABELS,
  } = useAppState();

  const hasNoEdits = editMethod === 'filters' && fieldEdits.length === 0;
  useEffect(() => {
    if (hasNoEdits) goToStep(2);
  }, [hasNoEdits, goToStep]);

  const previewUsers = selectedUsers.filter((u) => !excludedUserIds.includes(u.id));
  const excludedCount = excludedUserIds.length;
  const canSubmit = effectiveUserCount > 0;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPerUser, setShowPerUser] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const dateInputRef = useRef(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [previewStep, setPreviewStep] = useState(1);

  const csvFieldSummary = useMemo(() => {
    if (editMethod !== 'csv' || !parsedCsvData) return null;

    const { headers, rows } = parsedCsvData;
    const changedFields = new Map();
    const usersWithChanges = new Set();

    const userLookup = new Map();
    selectedUsers.forEach((u) => {
      userLookup.set(u.id, {
        'User ID': u.id,
        Name: u.name,
        Compensation: '100000',
        Title: u.role || 'Employee',
        Department: u.department,
        Location: u.country || '',
      });
    });

    rows.forEach((cols) => {
      const userId = String(cols[0] || '').trim();
      const original = userLookup.get(userId);
      if (!original) return;

      headers.forEach((h, ci) => {
        if (h === 'User ID' || h === 'Name') return;
        const newVal = String(cols[ci] || '').trim();
        const oldVal = String(original[h] || '').trim();
        if (newVal && newVal !== oldVal) {
          usersWithChanges.add(userId);
          if (!changedFields.has(h)) changedFields.set(h, { count: 0, samples: [], distinctValues: new Set(), numericValues: [] });
          const entry = changedFields.get(h);
          entry.count++;
          entry.distinctValues.add(newVal);
          const num = parseFloat(newVal.replace(/[$,]/g, ''));
          if (!isNaN(num)) entry.numericValues.push(num);
          if (entry.samples.length < 3) {
            entry.samples.push({ user: original.Name, from: oldVal || '(empty)', to: newVal });
          }
        }
      });
    });

    return { fields: changedFields, changedUserCount: usersWithChanges.size };
  }, [editMethod, parsedCsvData, selectedUsers]);

  const isSensitiveField = (label) =>
    SENSITIVE_LABELS.some((s) => label.toLowerCase().includes(s.toLowerCase()));

  const hasCriticalFields = useMemo(() => {
    if (editMethod === 'filters') {
      return fieldEdits.some((e) => CRITICAL_FIELDS.includes(e.fieldId));
    }
    if (editMethod === 'csv' && csvFieldSummary?.fields) {
      return [...csvFieldSummary.fields.keys()].some((label) =>
        CRITICAL_LABELS.some((cl) => label.toLowerCase().includes(cl.toLowerCase()))
      );
    }
    return false;
  }, [editMethod, fieldEdits, csvFieldSummary, CRITICAL_FIELDS, CRITICAL_LABELS]);

  const changedFieldNames = useMemo(() => {
    if (editMethod === 'filters') return fieldEdits.map((e) => e.field);
    if (editMethod === 'csv' && csvFieldSummary?.fields) return [...csvFieldSummary.fields.keys()];
    return [];
  }, [editMethod, fieldEdits, csvFieldSummary]);

  const affectedSystems = useMemo(() => {
    const systems = new Map();
    const fieldIds = editMethod === 'filters'
      ? fieldEdits.map((e) => e.fieldId)
      : (csvFieldSummary?.fields
        ? [...csvFieldSummary.fields.keys()].map((label) => {
            const entry = Object.entries(SYSTEM_IMPACT_MAP).find(
              ([key]) => label.toLowerCase().includes(key.toLowerCase())
            );
            return entry ? entry[0] : label.toLowerCase().replace(/\s+/g, '_');
          })
        : []);
    fieldIds.forEach((fid) => {
      const impacted = SYSTEM_IMPACT_MAP[fid] || [];
      impacted.forEach((sys) => {
        if (!systems.has(sys)) systems.set(sys, new Set());
        systems.get(sys).add(fid);
      });
    });
    return systems;
  }, [editMethod, fieldEdits, csvFieldSummary]);

  const countrySummary = useMemo(() => {
    const counts = {};
    previewUsers.forEach((u) => {
      counts[u.country] = (counts[u.country] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [previewUsers]);

  const handleOpenConfirm = () => {
    setConfirmChecked(false);
    setScheduleMode(false);
    setScheduledDate('');
    setShowConfirmModal(true);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    submitForApproval({
      changedFieldNames,
      requiresApproval: hasCriticalFields,
      scheduledDate: scheduleMode && scheduledDate ? scheduledDate : null,
    });
    setSubmitting(false);
    setShowConfirmModal(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const canConfirm = confirmChecked;

  const userCount = editMethod === 'csv' ? (csvFieldSummary?.changedUserCount || 0) : effectiveUserCount;

  const FIRST_PARTY = ['Payroll', 'Benefits & Insurance', 'Device Management', 'Cost Center Reporting'];
  const firstPartySystems = [...affectedSystems.keys()].filter((s) => FIRST_PARTY.includes(s));
  const thirdPartySystems = [...affectedSystems.keys()].filter((s) => !FIRST_PARTY.includes(s));
  const fieldCount = editMethod === 'csv' ? (csvFieldSummary?.fields?.size || 0) : fieldEdits.length;

  const SUB_STEPS = [
    { num: 1, label: 'Review Changes' },
    { num: 2, label: 'Impact & Submit' },
  ];

  return (
    <>
      <header className="step-header" style={{ marginBottom: '0.5rem' }}>
        <h1 className="step-title">Preview Changes</h1>
        <p className="step-description" style={{ margin: 0 }}>
          {previewStep === 1
            ? 'Review the fields and values being modified.'
            : 'Review downstream impact and submit your changes.'}
        </p>
      </header>


      {/* ========== SUB-STEP 1: Review Changes ========== */}
      {previewStep === 1 && (
        <>
          {/* Impact stats */}
          <div style={{
            display: 'flex', gap: '2rem', flexWrap: 'wrap',
            padding: '0.6rem 1rem', marginBottom: '0.75rem',
            background: '#F9FAFB', borderRadius: '8px', border: '1px solid var(--border)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Users affected</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>{userCount}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Fields changed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>{fieldCount}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Countries</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>{countrySummary.length}</div>
            </div>
            {excludedCount > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', color: '#92400E', marginBottom: '0.15rem' }}>Excluded</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>{excludedCount}</div>
              </div>
            )}
          </div>

          {/* Fields table */}
          <div className="card" style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Fields Being Changed</h3>

            {editMethod === 'filters' && fieldEdits.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Operation</th>
                      <th>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldEdits.map((edit, i) => {
                      const sensitive = SENSITIVE_FIELDS.includes(edit.fieldId);
                      return (
                        <tr key={i}>
                          <td>
                            <strong>{edit.field}</strong>
                            {sensitive && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#DC2626' }}>Sensitive</span>}
                          </td>
                          <td>{OP_LABELS[edit.operation] || edit.operation}</td>
                          <td>{edit.value || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {editMethod === 'filters' && fieldEdits.length > 0 && previewUsers.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPerUser((v) => !v)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 500,
                    padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}
                >
                  {showPerUser ? '▾' : '▸'} {showPerUser ? 'Hide' : 'View'} per-user changes ({previewUsers.length})
                </button>
                {showPerUser && (
                  <div className="table-wrap" style={{ marginTop: '0.5rem', maxHeight: '340px', overflowY: 'auto' }}>
                    <table style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>User</th>
                          {fieldEdits.map((e, i) => <th key={i}>{e.field}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewUsers.map((u) => (
                          <tr key={u.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{u.name}</td>
                            {fieldEdits.map((edit, i) => {
                              const orig = getOriginalValue(u, edit.fieldId);
                              const final = computeFinalValue(orig, edit);
                              const changed = orig !== final;
                              return (
                                <td key={i} style={changed ? { color: '#1E40AF', fontWeight: 600 } : {}}>
                                  {changed ? (
                                    <span>{orig} → {final}</span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>{orig || '—'}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {editMethod === 'csv' && csvFieldSummary && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Users Changed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvFieldSummary.fields.size === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                          No field changes detected in the uploaded CSV.
                        </td>
                      </tr>
                    ) : (
                      [...csvFieldSummary.fields.entries()].map(([field, data]) => {
                        const sensitive = isSensitiveField(field);
                        return (
                          <tr key={field}>
                            <td>
                              <strong>{field}</strong>
                              {sensitive && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#DC2626' }}>Sensitive</span>}
                            </td>
                            <td>{data.count} user(s)</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="step-actions">
            <button type="button" className="btn btn-secondary" onClick={() => goToStep(2)}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSubmit}
              onClick={() => setPreviewStep(2)}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {/* ========== SUB-STEP 2: Impact & Submit ========== */}
      {previewStep === 2 && (
        <>
          {/* Affected Systems */}
          {affectedSystems.size > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#DC2626' }}>Affected Systems ⚠</h3>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                The following downstream systems will be synced after changes are applied.
              </p>

              {firstPartySystems.length > 0 && (
                <div style={{ marginBottom: thirdPartySystems.length > 0 ? '0.75rem' : 0 }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>First-party systems</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {firstPartySystems.map((sys) => (
                      <span
                        key={sys}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: '#EFF6FF', borderLeft: '3px solid #3B82F6',
                          borderRadius: '6px', padding: '0.4rem 0.7rem',
                          fontSize: '0.84rem', fontWeight: 500, color: '#1E40AF',
                        }}
                      >
                        <span>{SYSTEM_ICONS[sys] || '🔗'}</span>
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {thirdPartySystems.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Third-party integrations</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {thirdPartySystems.map((sys) => (
                      <span
                        key={sys}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          background: '#F5F3FF', borderLeft: '3px solid #8B5CF6',
                          borderRadius: '6px', padding: '0.4rem 0.7rem',
                          fontSize: '0.84rem', fontWeight: 500, color: '#5B21B6',
                        }}
                      >
                        <span>{SYSTEM_ICONS[sys] || '🔗'}</span>
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Excluded users warning */}
          {excludedCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px',
              padding: '0.55rem 0.85rem', marginBottom: '1rem', fontSize: '0.84rem', color: '#92400E',
            }}>
              <strong>{excludedCount}</strong> user(s) excluded due to validation errors. Remaining <strong>{effectiveUserCount}</strong> will proceed.
            </div>
          )}

          {!canSubmit && (
            <p className="error-message" style={{ marginBottom: '1rem' }}>
              No users to update after exclusions. Go back to add more users or fix errors.
            </p>
          )}

          <div className="step-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setPreviewStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSubmit}
              onClick={handleOpenConfirm}
            >
              {hasCriticalFields ? 'Submit for approval' : 'Confirm and apply'}
            </button>
          </div>
        </>
      )}

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                {hasCriticalFields ? 'Submit for Approval' : 'Confirm Changes'}
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.15rem 0.25rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 0.6rem 0' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                <strong>{userCount}</strong> user(s) will be updated.
              </p>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    border: scheduledDate ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: scheduledDate ? '#EFF6FF' : '#fff',
                    color: scheduledDate ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>&#128197;</span>
                  {scheduledDate
                    ? new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Schedule'}
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={scheduledDate}
                  min={todayStr}
                  onChange={(e) => {
                    setScheduledDate(e.target.value);
                    setScheduleMode(!!e.target.value);
                  }}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                />
                {scheduledDate && (
                  <button
                    type="button"
                    onClick={() => { setScheduledDate(''); setScheduleMode(false); }}
                    title="Clear scheduled date"
                    style={{
                      marginLeft: '0.25rem', background: 'none', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem',
                      padding: '0 0.1rem', lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {hasCriticalFields ? (
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#991B1B', lineHeight: 1.5, background: '#FEF2F2', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                Sensitive fields are being modified. This will be sent for approval before changes are applied.
              </p>
            ) : (
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#065F46', lineHeight: 1.5, background: '#ECFDF5', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                No sensitive fields detected. Changes will be applied directly.
              </p>
            )}

            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem', paddingTop: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.88rem', lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  style={{ marginTop: '0.15rem' }}
                />
                I have reviewed the changes and confirm they are correct.
              </label>
              {scheduledDate && (
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#5B21B6', lineHeight: 1.5, background: '#F5F3FF', padding: '0.45rem 0.65rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>📅</span>
                  Scheduled for <strong>{new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                  <button
                    type="button"
                    onClick={() => { setScheduledDate(''); setScheduleMode(false); }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#7C3AED', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline', padding: 0 }}
                  >
                    Clear
                  </button>
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!confirmChecked || submitting}
                  onClick={handleSubmit}
                >
                  {submitting
                    ? 'Submitting…'
                    : hasCriticalFields
                      ? 'Submit for approval'
                      : scheduledDate
                        ? 'Schedule changes'
                        : 'Apply changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
