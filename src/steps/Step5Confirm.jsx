import { useState } from 'react';
import { useAppState } from '../context/AppState';

export function Step5Confirm() {
  const {
    effectiveUserCount,
    fieldEdits,
    confirmChecked,
    setConfirmChecked,
    submitForApproval,
    goToStep,
  } = useAppState();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    submitForApproval();
    setSubmitting(false);
  };

  return (
    <>
      <header className="step-header">

        <h1 className="step-title">Confirm & Submit</h1>
        <p className="step-description">
          Final confirmation. Submit for approval to apply these bulk changes.
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Recap</h3>
        <p style={{ margin: 0 }}>
          <strong>{effectiveUserCount}</strong> user(s) will be updated.
        </p>
        <p style={{ margin: '0.5rem 0 0 0' }}>
          Fields: {fieldEdits.map((e) => e.field).join(', ') || '—'}
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          This request will go through the approval flow. You will be notified once approved.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
          />
          I have reviewed the changes and confirm they are correct.
        </label>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={() => goToStep(4)} disabled={submitting}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!confirmChecked || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting…' : 'Submit for approval'}
        </button>
      </div>
    </>
  );
}
