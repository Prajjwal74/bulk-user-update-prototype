import { useAppState } from '../context/AppState';

export function Step6Approval() {
  const { requestId, approvalStatus, setApprovalStatus, setCurrentStep, goToStep, setHistory } = useAppState();

  const handleApprove = () => {
    setApprovalStatus('approved');
    setHistory((prev) =>
      prev.map((h) => (h.requestId === requestId ? { ...h, status: 'Applied' } : h))
    );
  };

  return (
    <>
      <header className="step-header">

        <h1 className="step-title">Approval & Notify</h1>
        <p className="step-description">
          Your bulk update request status. You will be notified when approved or rejected.
        </p>
      </header>

      {approvalStatus === 'pending' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Pending approval</h3>
          <p style={{ margin: 0 }}>
            Your bulk update is pending approval.
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Request ID: <strong>{requestId}</strong>
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Submitted by: Current User · {new Date().toLocaleDateString()}
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleApprove}>
              Simulate: Mark approved
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setApprovalStatus('rejected')}>
              Simulate: Reject
            </button>
          </div>
        </div>
      )}

      {approvalStatus === 'approved' && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--success)', background: '#d4edda' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>Approved and applied</h3>
          <p style={{ margin: 0 }}>
            Your bulk update has been approved and applied.
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Request ID: <strong>{requestId}</strong>
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setCurrentStep(7)}>
            View in Edit History
          </button>
        </div>
      )}

      {approvalStatus === 'rejected' && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--error)', background: '#f8d7da' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>Rejected</h3>
          <p style={{ margin: 0 }}>
            Your bulk update was rejected.
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Reason: (Optional reason from approver would appear here.)
          </p>
          <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={() => goToStep(1)}>
            Edit and resubmit
          </button>
        </div>
      )}

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(7)}>
          Edit History
        </button>
      </div>
    </>
  );
}
