import { useState } from 'react';
import { useAppState } from '../context/AppState';

export function Step7EditHistory() {
  const { history, setHistory } = useAppState();
  const [viewingId, setViewingId] = useState(null);
  const [reversingId, setReversingId] = useState(null);
  const [reverseConfirm, setReverseConfirm] = useState(false);

  const selectedRequest = history.find((h) => h.requestId === viewingId);
  const canReverse = (req) => req.status === 'Applied' && !req.reversed;

  const handleReverse = (requestId) => {
    setReversingId(requestId);
    setReverseConfirm(true);
  };

  const confirmReverse = () => {
    if (!reversingId) return;
    setHistory((prev) => {
      const updated = prev.map((h) =>
        h.requestId === reversingId ? { ...h, reversed: true, status: 'Reversed' } : h
      );
      return [
        ...updated,
        {
          requestId: `REV-${reversingId}`,
          submittedBy: 'Current User',
          date: new Date().toISOString(),
          userCount: 0,
          fieldsChanged: '—',
          status: 'Pending',
          statusDetail: `Reversal of ${reversingId}`,
        },
      ];
    });
    setReversingId(null);
    setReverseConfirm(false);
  };

  return (
    <>
      <header className="step-header">

        <h1 className="step-title">Edit History</h1>
        <p className="step-description">
          Audit trail of bulk update requests. View details or reverse changes when applicable.
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Past requests</h3>
        {history.length === 0 ? (
          <p className="empty-state">No bulk update requests yet. Submit a request from the flow to see it here.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Submitted by</th>
                  <th>Date</th>
                  <th>User count</th>
                  <th>Fields changed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.requestId}>
                    <td>{h.requestId}</td>
                    <td>{h.submittedBy}</td>
                    <td>{new Date(h.date).toLocaleDateString()}</td>
                    <td>{h.userCount}</td>
                    <td>{h.fieldsChanged}</td>
                    <td>
                      <span
                        className={`badge ${
                          h.status === 'Applied' ? 'badge--success' : h.status === 'Rejected' ? 'badge--danger' : 'badge--muted'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.35rem' }}
                        onClick={() => setViewingId(viewingId === h.requestId ? null : h.requestId)}
                      >
                        View details
                      </button>
                      {canReverse(h) && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => handleReverse(h.requestId)}
                        >
                          Reverse
                        </button>
                      )}
                      {h.status === 'Applied' && h.reversed && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reversed</span>
                      )}
                      {h.status === 'Pending' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} title="Reversal not supported for pending requests">
                          Reverse N/A
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Request details: {selectedRequest.requestId}</h3>
          <p style={{ margin: 0 }}>Submitted by {selectedRequest.submittedBy} on {new Date(selectedRequest.date).toLocaleString()}.</p>
          <p style={{ margin: '0.35rem 0 0 0' }}>Users: {selectedRequest.userCount} · Fields: {selectedRequest.fieldsChanged}</p>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Read-only summary. Full user/field list would appear here.
          </p>
          <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={() => setViewingId(null)}>
            Close
          </button>
        </div>
      )}

      {reverseConfirm && reversingId && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--error)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Confirm reversal</h3>
          <p style={{ margin: 0 }}>
            This will revert the changes from request <strong>{reversingId}</strong> to previous values. A new reversal request will be created.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-danger" onClick={confirmReverse}>
              Confirm reverse
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setReversingId(null); setReverseConfirm(false); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
