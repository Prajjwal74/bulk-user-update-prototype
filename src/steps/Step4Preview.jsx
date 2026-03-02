import { useAppState } from '../context/AppState';

export function Step4Preview() {
  const {
    selectedUsers,
    excludedUserIds,
    fieldEdits,
    effectiveUserCount,
    setCurrentStep,
    goToStep,
  } = useAppState();

  const previewUsers = selectedUsers.filter((u) => !excludedUserIds.includes(u.id));
  const excludedCount = excludedUserIds.length;
  const sample = previewUsers.slice(0, 15);
  const displayEdits = fieldEdits.length > 0 ? fieldEdits : [{ field: 'Various', value: '(from CSV per row)' }];

  const canSubmit = effectiveUserCount > 0;

  return (
    <>
      <header className="step-header">

        <h1 className="step-title">Preview Changes</h1>
        <p className="step-description">
          Review the summary of changes before submitting for approval.
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Summary</h3>
        <p style={{ margin: 0 }}>
          You are about to update <strong>{effectiveUserCount}</strong> user(s).
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Fields affected: {displayEdits.map((e) => e.field).join(', ') || '—'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Sample of changes</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>ID</th>
                <th>Field</th>
                <th>Current</th>
                <th>New</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((user) =>
                displayEdits.map((edit, ei) => (
                  <tr key={`${user.id}-${ei}`}>
                    <td>{user.name}</td>
                    <td>{user.id}</td>
                    <td>{edit.field}</td>
                    <td style={{ color: 'var(--text-muted)' }}>—</td>
                    <td>{edit.value}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {previewUsers.length > 15 && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing 15 of {previewUsers.length} rows. All changes will be applied on confirm.
          </p>
        )}
      </div>

      {excludedCount > 0 && (
        <div className="card" style={{ marginBottom: '1rem', background: '#fff3cd' }}>
          <p style={{ margin: 0 }}>
            <strong>{excludedCount}</strong> user(s) excluded due to validation errors.
          </p>
          <button type="button" className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
            Download excluded list
          </button>
        </div>
      )}

      {!canSubmit && (
        <p className="error-message" style={{ marginBottom: '1rem' }}>
          No users to update after exclusions. Go back to add more users or fix errors.
        </p>
      )}

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={() => goToStep(3)}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSubmit}
          onClick={() => setCurrentStep(5)}
        >
          Confirm and submit
        </button>
      </div>
    </>
  );
}
