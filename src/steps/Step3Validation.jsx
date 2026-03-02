import { useAppState } from '../context/AppState';

const MOCK_VALIDATION_ERRORS = [
  { id: 'v1', field: 'Compensation', message: 'Enter a valid amount (positive number).', type: 'validation' },
  { id: 'v2', field: 'Title', message: 'Title cannot be empty.', type: 'validation' },
  { id: 'v3', field: 'Department', message: 'Value must be one of: Engineering, Product, Design, Sales.', type: 'format' },
];

export function Step3Validation() {
  const { validationErrors, setValidationErrors, setCurrentStep, goToStep, editMethod, setCsvFile, setCsvValidation } = useAppState();

  const errors = validationErrors.length > 0 ? validationErrors : MOCK_VALIDATION_ERRORS;

  const handleReupload = () => {
    setCsvFile(null);
    setCsvValidation(null);
    setValidationErrors([]);
    setCurrentStep(2);
  };

  const handleContinueExcluding = () => {
    setValidationErrors([]);
    setCurrentStep(4);
  };

  return (
    <>
      <header className="step-header">

        <h1 className="step-title">Validation & Errors</h1>
        <p className="step-description">
          The system has identified errors in your input. Fix them below or continue by excluding rows with issues.
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--error)', background: '#fef2f2' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--error)' }}>Validation summary</h3>
        <p style={{ margin: '0 0 1rem 0' }}>{errors.length} issue(s) to fix.</p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {errors.map((e) => (
            <li key={e.id} style={{ marginBottom: '0.35rem' }}>
              <strong>{e.field}:</strong> {e.message}
              <span className="badge badge--muted" style={{ marginLeft: '0.5rem' }}>{e.type}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>
          Fix the errors in place above, or if you used CSV upload you can re-upload a corrected file.
        </p>
        {editMethod === 'csv' && (
          <button type="button" className="btn btn-secondary" style={{ marginRight: '0.5rem' }} onClick={handleReupload}>
            Re-upload corrected CSV
          </button>
        )}
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={() => goToStep(2)}>
          Back
        </button>
        {editMethod === 'csv' && (
          <button type="button" className="btn btn-secondary" onClick={handleContinueExcluding}>
            Continue and exclude error rows
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={() => { setValidationErrors([]); setCurrentStep(4); }}>
          Revalidate and preview
        </button>
      </div>
    </>
  );
}
