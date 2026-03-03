import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppState } from '../context/AppState';

const STATUS_CONFIG = {
  pending: {
    icon: '⏳',
    label: 'Pending Approval',
    accent: '#6B7280',
    bg: '#fff',
    text: '#374151',
  },
  processing: {
    icon: '⟳',
    label: 'Applying Changes…',
    accent: '#2563EB',
    bg: '#fff',
    text: '#1E40AF',
  },
  partial_failure: {
    icon: '!',
    label: 'Partial Failure',
    accent: '#D97706',
    bg: '#fff',
    text: '#92400E',
  },
  approved: {
    icon: '✓',
    label: 'Approved & Applied',
    accent: '#059669',
    bg: '#fff',
    text: '#065F46',
  },
  applied: {
    icon: '✓',
    label: 'Applied Successfully',
    accent: '#059669',
    bg: '#fff',
    text: '#065F46',
  },
  rejected: {
    icon: '✕',
    label: 'Rejected',
    accent: '#DC2626',
    bg: '#fff',
    text: '#991B1B',
  },
  scheduled: {
    icon: '📅',
    label: 'Scheduled',
    accent: '#7C3AED',
    bg: '#fff',
    text: '#5B21B6',
  },
  scheduled_pending: {
    icon: '📅',
    label: 'Scheduled – Pending Approval',
    accent: '#7C3AED',
    bg: '#fff',
    text: '#5B21B6',
  },
  cancelled: {
    icon: '⊘',
    label: 'Cancelled',
    accent: '#6B7280',
    bg: '#fff',
    text: '#374151',
  },
};

export function Step6Approval() {
  const {
    requestId,
    approvalStatus,
    setApprovalStatus,
    setCurrentStep,
    goToStep,
    history,
    setHistory,
    effectiveUserCount,
  } = useAppState();

  const currentEntry = history.find((h) => h.requestId === requestId);
  const scheduledDateStr = currentEntry?.scheduledDate
    ? new Date(currentEntry.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const [progress, setProgress] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const cancelRef = useRef(null);

  const simulateProcessing = useCallback(() => {
    setProgress(0);
    setFailedCount(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 15) + 10;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        const shouldFail = Math.random() < 0.4;
        if (shouldFail) {
          const failed = Math.max(1, Math.floor(effectiveUserCount * 0.15));
          setFailedCount(failed);
          setApprovalStatus('partial_failure');
          setHistory((prev) =>
            prev.map((h) => (h.requestId === requestId ? { ...h, status: 'Partial Failure', statusDetail: `${failed} user(s) failed` } : h))
          );
        } else {
          setApprovalStatus('applied');
          setHistory((prev) =>
            prev.map((h) => (h.requestId === requestId ? { ...h, status: 'Applied' } : h))
          );
        }
      }
      setProgress(p);
    }, 400);
    return () => clearInterval(interval);
  }, [effectiveUserCount, requestId, setApprovalStatus, setHistory]);

  useEffect(() => {
    if (approvalStatus === 'processing') {
      const cleanup = simulateProcessing();
      cancelRef.current = cleanup;
      return () => {
        cleanup();
        cancelRef.current = null;
      };
    }
    return undefined;
  }, [approvalStatus, simulateProcessing]);

  const handleApprove = () => {
    setApprovalStatus('processing');
  };

  const handleRetryFailed = () => {
    setRetrying(true);
    setFailedCount(0);
    setProgress(0);
    setApprovalStatus('processing');
    setTimeout(() => setRetrying(false), 500);
  };

  const handleCancelProcessing = () => {
    if (cancelRef.current) cancelRef.current();
    cancelRef.current = null;
    setApprovalStatus('cancelled');
    setHistory((prev) =>
      prev.map((h) =>
        h.requestId === requestId
          ? { ...h, status: 'Cancelled', statusDetail: `Cancelled at ${progress}% — no changes applied` }
          : h
      )
    );
  };

  const handleSkipFailed = () => {
    setApprovalStatus('applied');
    setHistory((prev) =>
      prev.map((h) =>
        h.requestId === requestId
          ? { ...h, status: 'Applied (Partial)', statusDetail: `${failedCount} user(s) skipped` }
          : h
      )
    );
  };

  const cfg = STATUS_CONFIG[approvalStatus] || STATUS_CONFIG.pending;

  const metaGrid = (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '0.5rem', background: 'var(--bg)', borderRadius: '8px',
      padding: '0.65rem 0.85rem', marginBottom: '0.75rem',
    }}>
      <div>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Request ID</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>{requestId}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Users</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{effectiveUserCount}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Submitted</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{new Date().toLocaleDateString()}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>By</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Current User</div>
      </div>
    </div>
  );

  return (
    <>
      <header className="step-header">
        <h1 className="step-title">
          {approvalStatus === 'scheduled' || approvalStatus === 'scheduled_pending' ? 'Scheduled Change' : approvalStatus === 'pending' ? 'Approval & Notify' : 'Apply Changes'}
        </h1>
        <p className="step-description">
          {approvalStatus === 'scheduled'
            ? 'Your changes have been scheduled for a future date.'
            : approvalStatus === 'scheduled_pending'
              ? 'Your changes are scheduled and awaiting approval.'
              : approvalStatus === 'pending'
              ? 'Track the status of your bulk update request.'
              : 'Changes are being applied to the selected users.'}
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${cfg.accent}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '50%',
            background: cfg.accent, color: '#fff', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
          }}>
            {cfg.icon}
          </span>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: cfg.text }}>{cfg.label}</h3>
        </div>

        {metaGrid}

        {approvalStatus === 'processing' && (
          <>
            <div style={{ background: '#E5E7EB', borderRadius: '4px', height: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{
                width: `${progress}%`, height: '100%', background: '#2563EB',
                borderRadius: '4px', transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Applying changes… {progress}% complete
              </p>
              <button
                type="button"
                onClick={handleCancelProcessing}
                style={{
                  background: 'none', border: '1px solid #DC2626', color: '#DC2626',
                  borderRadius: '6px', padding: '0.3rem 0.7rem', fontSize: '0.78rem',
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {approvalStatus === 'partial_failure' && (
          <>
            <div style={{
              background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px',
              padding: '0.65rem 0.85rem', marginBottom: '0.75rem',
            }}>
              <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#92400E' }}>
                {effectiveUserCount - failedCount} of {effectiveUserCount} changes applied successfully
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400E', lineHeight: 1.5 }}>
                <strong>{failedCount}</strong> user(s) failed due to technical issues. You can retry the failed changes or proceed with the successful ones.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={handleRetryFailed} disabled={retrying}>
                {retrying ? 'Retrying…' : 'Retry failed changes'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={handleSkipFailed}>
                Continue without failed
              </button>
            </div>
          </>
        )}

        {approvalStatus === 'pending' && (
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Your request is awaiting approval. You will be notified once a decision is made.
          </p>
        )}
        {(approvalStatus === 'approved' || approvalStatus === 'applied') && (
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: cfg.text, lineHeight: 1.5 }}>
            All changes have been successfully applied.
          </p>
        )}
        {approvalStatus === 'rejected' && (
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: cfg.text, lineHeight: 1.5 }}>
            Your request was rejected. You can edit and resubmit.
          </p>
        )}
        {approvalStatus === 'cancelled' && (
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: cfg.text, lineHeight: 1.5 }}>
            Processing was cancelled. No changes were applied. You can resubmit or start a new request.
          </p>
        )}
        {(approvalStatus === 'scheduled' || approvalStatus === 'scheduled_pending') && (
          <div style={{
            background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '8px',
            padding: '0.65rem 0.85rem', marginBottom: '0.75rem',
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#5B21B6' }}>
              📅 Scheduled for {scheduledDateStr}
            </p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#6D28D9', lineHeight: 1.5 }}>
              {approvalStatus === 'scheduled_pending'
                ? 'Sensitive fields are being modified. Changes will be applied on the scheduled date only after approval is granted.'
                : 'Changes will be automatically applied on the scheduled date. You will be notified once processing begins.'}
            </p>
          </div>
        )}
      </div>

      {(approvalStatus === 'pending' || approvalStatus === 'scheduled_pending') && (
        <div className="card" style={{ marginBottom: '1rem', background: 'var(--surface)', border: '1px dashed var(--border)' }}>
          <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Simulation controls (prototype only)
          </p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={handleApprove}>
              Mark as approved
            </button>
            <button type="button" className="btn btn-danger" style={{ fontSize: '0.85rem' }} onClick={() => setApprovalStatus('rejected')}>
              Mark as rejected
            </button>
          </div>
        </div>
      )}

      <div className="step-actions">
        {(approvalStatus === 'rejected' || approvalStatus === 'cancelled') && (
          <button type="button" className="btn btn-secondary" onClick={() => goToStep(1)}>
            Edit and resubmit
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(0)}>
          View Edit History
        </button>
      </div>
    </>
  );
}
