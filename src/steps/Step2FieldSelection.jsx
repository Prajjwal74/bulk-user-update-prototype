import { useState } from 'react';
import { useAppState } from '../context/AppState';

const FIELDS = [
  { id: 'compensation', label: 'Compensation', type: 'currency', operations: ['change_to', 'increase_by', 'decrease_by', 'increase_pct', 'decrease_pct'] },
  { id: 'title', label: 'Title', type: 'text', operations: ['change_to'] },
  { id: 'department', label: 'Department', type: 'select', options: ['Engineering', 'Product', 'Design', 'Sales'], operations: ['change_to'] },
  { id: 'location', label: 'Location', type: 'text', operations: ['change_to'] },
  { id: 'level', label: 'Level', type: 'text', operations: ['change_to'] },
];

const OP_LABELS = {
  change_to: 'Change to',
  increase_by: 'Increase by (amount)',
  decrease_by: 'Decrease by (amount)',
  increase_pct: 'Increase by (%)',
  decrease_pct: 'Decrease by (%)',
};

export function Step2FieldSelection() {
  const {
    editMethod,
    setEditMethod,
    fieldEdits,
    setFieldEdits,
    csvFile,
    setCsvFile,
    csvValidation,
    setCsvValidation,
    setValidationErrors,
    setCurrentStep,
    goToStep,
    selectedUsers,
  } = useAppState();

  const [newField, setNewField] = useState('');
  const [newOp, setNewOp] = useState('change_to');
  const [newValue, setNewValue] = useState('');
  const [newValueError, setNewValueError] = useState('');
  const [showCsvErrors, setShowCsvErrors] = useState(false);
  const [csvExcludeRows, setCsvExcludeRows] = useState(false);

  const validateValue = (fieldId, op, value) => {
    const f = FIELDS.find((x) => x.id === fieldId);
    if (!f || !value) return '';
    if (f.type === 'currency' && (op.includes('increase') || op.includes('decrease'))) {
      const n = parseFloat(value);
      if (isNaN(n) || n < 0) return 'Enter a valid number.';
    }
    if (f.type === 'currency' && op === 'change_to') {
      const n = parseFloat(String(value).replace(/[$,]/g, ''));
      if (isNaN(n) || n < 0) return 'Enter a valid amount.';
    }
    if (f.id === 'compensation' && op.includes('pct')) {
      const n = parseFloat(value);
      if (isNaN(n) || n < 0 || n > 100) return 'Enter a percentage between 0 and 100.';
    }
    return '';
  };

  const handleAddFieldEdit = () => {
    if (!newField) return;
    const err = validateValue(newField, newOp, newValue);
    setNewValueError(err);
    if (err) return;
    const field = FIELDS.find((f) => f.id === newField);
    setFieldEdits((prev) => [...prev, { field: field?.label || newField, fieldId: newField, operation: newOp, value: newValue }]);
    setNewField('');
    setNewOp('change_to');
    setNewValue('');
    setNewValueError('');
  };

  const handleRemoveFieldEdit = (index) => {
    setFieldEdits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setCsvValidation({ valid: false, errorCount: 0, errors: [{ row: 0, type: 'format', message: 'File must be a CSV.' }] });
      setShowCsvErrors(true);
      return;
    }
    setCsvFile(file);
    const mockErrors = [
      { row: 2, type: 'validation', message: 'Compensation must be a positive number.' },
      { row: 5, type: 'format', message: 'Invalid date format for Start Date.' },
    ];
    setCsvValidation({ valid: false, errorCount: 2, errors: mockErrors });
    setShowCsvErrors(true);
  };

  const handleDownloadTemplate = () => {
    const headers = ['User ID', 'Name', 'Compensation', 'Title', 'Department', 'Location'];
    const rows = selectedUsers.slice(0, 5).map((u) => [u.id, u.name, '100000', u.role || 'Employee', u.department, '']);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_update_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinueWithExclusions = () => {
    setValidationErrors([]);
    setShowCsvErrors(false);
    setCurrentStep(4);
  };

  const handleReupload = () => {
    setCsvFile(null);
    setCsvValidation(null);
    setShowCsvErrors(false);
  };

  const hasValidationIssues = editMethod === 'csv' && csvValidation && !csvValidation.valid;
  const canProceedFilters = editMethod === 'filters' && fieldEdits.length > 0;
  const canProceedCsv = editMethod === 'csv' && csvFile && (csvValidation?.valid || csvExcludeRows);
  const canGoToValidation = editMethod === 'csv' && csvFile && csvValidation && !csvValidation.valid;
  const canProceed = canProceedFilters || canProceedCsv || canGoToValidation;

  return (
    <>
      <header className="step-header">

        <h1 className="step-title">Field Selection & Edit</h1>
        <p className="step-description">
          Choose how to specify changes: by filters and rules, or by CSV upload. Add the fields you want to edit and their new values.
        </p>
      </header>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Method</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="editMethod"
              checked={editMethod === 'filters'}
              onChange={() => setEditMethod('filters')}
            />
            Edit by filters & rules
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="editMethod"
              checked={editMethod === 'csv'}
              onChange={() => setEditMethod('csv')}
            />
            Edit by CSV upload
          </label>
        </div>
      </div>

      {editMethod === 'filters' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Field changes</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <select
              className="form-input"
              style={{ width: '160px' }}
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
            >
              <option value="">Select field</option>
              {FIELDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ width: '180px' }}
              value={newOp}
              onChange={(e) => setNewOp(e.target.value)}
            >
              {(FIELDS.find((f) => f.id === newField)?.operations || ['change_to']).map((op) => (
                <option key={op} value={op}>
                  {OP_LABELS[op] || op}
                </option>
              ))}
            </select>
            <input
              type="text"
              className={`form-input ${newValueError ? 'error' : ''}`}
              style={{ width: '140px' }}
              placeholder={FIELDS.find((f) => f.id === newField)?.type === 'currency' ? 'e.g. 50000' : 'Value'}
              value={newValue}
              onChange={(e) => {
                setNewValue(e.target.value);
                setNewValueError(validateValue(newField, newOp, e.target.value));
              }}
            />
            <button type="button" className="btn btn-secondary" onClick={handleAddFieldEdit}>
              Add change
            </button>
          </div>
          {newValueError && <p className="error-message">{newValueError}</p>}
          {fieldEdits.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {fieldEdits.map((e, i) => (
                <li key={i} style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{e.field} → {OP_LABELS[e.operation] || e.operation}: {e.value}</span>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleRemoveFieldEdit(i)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editMethod === 'csv' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>CSV upload</h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Download a template pre-filled with selected users. Edit the values and re-upload.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleDownloadTemplate}>
              Download CSV template
            </button>
            <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer' }}>
              Upload CSV
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
          </div>
          {csvFile && <p style={{ margin: 0, fontSize: '0.9rem' }}>Uploaded: {csvFile.name}</p>}

          {showCsvErrors && csvValidation && !csvValidation.valid && (
            <div className="card" style={{ marginTop: '1rem', borderColor: 'var(--error)', background: '#fef2f2' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--error)' }}>Validation results</h4>
              <p style={{ margin: '0 0 0.75rem 0' }}>{csvValidation.errorCount} row(s) have errors.</p>
              <button type="button" className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>
                Download error CSV
              </button>
              <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Error CSV is colour-coded and lists all error descriptions per row.
              </p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setCsvExcludeRows(true); handleContinueWithExclusions(); }}>
                  Continue and exclude error rows
                </button>
                <button type="button" className="btn btn-primary" onClick={handleReupload}>
                  Re-upload corrected CSV
                </button>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Re-upload must be the entire CSV with all issues rectified.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={() => goToStep(1)}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!editMethod || !canProceed}
          onClick={() => {
            if (hasValidationIssues && !csvExcludeRows) setCurrentStep(3);
            else setCurrentStep(4);
          }}
        >
          {hasValidationIssues && !csvExcludeRows ? 'Review errors' : 'Preview changes'}
        </button>
      </div>
    </>
  );
}
