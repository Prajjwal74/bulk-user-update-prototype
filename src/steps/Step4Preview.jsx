import { useMemo, useState } from 'react';
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

  const previewUsers = selectedUsers.filter((u) => !excludedUserIds.includes(u.id));
  const excludedCount = excludedUserIds.length;
  const canSubmit = effectiveUserCount > 0;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const countrySummary = useMemo(() => {
    const counts = {};
    previewUsers.forEach((u) => {
      counts[u.country] = (counts[u.country] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [previewUsers]);

  const handleOpenConfirm = () => {
    setConfirmChecked(false);
    setShowConfirmModal(true);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    submitForApproval({
      changedFieldNames,
      requiresApproval: hasCriticalFields,
    });
    setSubmitting(false);
    setShowConfirmModal(false);
  };

  const userCount = editMethod === 'csv' ? (csvFieldSummary?.changedUserCount || 0) : effectiveUserCount;

  return (
    <>
      <header className="step-header">
        <h1 className="step-title">Preview Changes</h1>
        <p className="step-description">
          Review the summary of changes before submitting.
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Impact Summary</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' }}>{userCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Users affected</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
              {editMethod === 'csv' ? (csvFieldSummary?.fields?.size || 0) : fieldEdits.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fields changed</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>{countrySummary.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Countries</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
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

      {hasCriticalFields && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px',
          padding: '0.6rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#991B1B',
        }}>
          <span style={{ fontWeight: 600 }}>Approval required</span>
          <span style={{ color: '#B91C1C' }}>— sensitive fields detected. This change will require approval before applying.</span>
        </div>
      )}

      {!hasCriticalFields && canSubmit && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px',
          padding: '0.6rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#065F46',
        }}>
          <span style={{ fontWeight: 600 }}>Direct apply</span>
          <span>— no sensitive fields. Changes will be applied directly after confirmation.</span>
        </div>
      )}

      {excludedCount > 0 && (
        <div className="card" style={{ marginBottom: '1rem', background: '#FFF3CD', borderColor: '#FCD34D' }}>
          <p style={{ margin: 0 }}>
            <strong>{excludedCount}</strong> user(s) excluded due to validation errors. Remaining <strong>{effectiveUserCount}</strong> will proceed.
          </p>
        </div>
      )}

      {!canSubmit && (
        <p className="error-message" style={{ marginBottom: '1rem' }}>
          No users to update after exclusions. Go back to add more users or fix errors.
        </p>
      )}

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={() => goToStep(2)}>
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

            <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <strong>{userCount}</strong> user(s) will be updated.
            </p>

            {hasCriticalFields ? (
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#991B1B', lineHeight: 1.5, background: '#FEF2F2', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                Sensitive fields are being modified. This will be sent for approval before changes are applied.
              </p>
            ) : (
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#065F46', lineHeight: 1.5, background: '#ECFDF5', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                No sensitive fields detected. Changes will be applied directly.
              </p>
            )}

            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.88rem', lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  style={{ marginTop: '0.15rem' }}
                />
                I have reviewed the changes and confirm they are correct.
              </label>
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
                  {submitting ? 'Submitting…' : hasCriticalFields ? 'Submit for approval' : 'Apply changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
