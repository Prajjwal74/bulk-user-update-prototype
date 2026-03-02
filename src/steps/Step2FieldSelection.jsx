import { useState, useMemo } from 'react';
import { useAppState } from '../context/AppState';

const COUNTRY_CURRENCY = {
  USA: 'USD', India: 'INR', UK: 'GBP', Canada: 'CAD', Australia: 'AUD',
  Germany: 'EUR', France: 'EUR', Japan: 'JPY', Singapore: 'SGD',
  Brazil: 'BRL', Mexico: 'MXN', Spain: 'EUR', Italy: 'EUR', Netherlands: 'EUR',
};

const FIELDS = [
  { id: 'compensation', label: 'Compensation', type: 'currency', operations: ['change_to', 'increase_by', 'decrease_by', 'increase_pct', 'decrease_pct'], placeholder: 'e.g. 50000' },
  { id: 'title', label: 'Title', type: 'text', operations: ['change_to', 'append', 'prepend'], placeholder: 'e.g. Senior Engineer' },
  { id: 'department', label: 'Department', type: 'select', options: ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Legal'], operations: ['change_to'] },
  { id: 'location', label: 'Location', type: 'text', operations: ['change_to'], placeholder: 'e.g. New York, NY' },
  { id: 'level', label: 'Level', type: 'text', operations: ['change_to', 'promote', 'demote'], placeholder: 'e.g. L5' },
  { id: 'manager', label: 'Manager', type: 'text', operations: ['change_to', 'clear'], placeholder: 'Manager name or ID' },
  { id: 'employment_type', label: 'Employment Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Intern', 'Temporary'], operations: ['change_to'] },
  { id: 'work_mode', label: 'Work Mode', type: 'select', options: ['Remote', 'Hybrid', 'On-site'], operations: ['change_to'] },
  { id: 'cost_center', label: 'Cost Center', type: 'text', operations: ['change_to', 'clear'], placeholder: 'e.g. CC-4200' },
  { id: 'currency', label: 'Pay Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY'], operations: ['change_to'] },
  { id: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive', 'Suspended'], operations: ['change_to'] },
  { id: 'team', label: 'Team / Group', type: 'text', operations: ['change_to', 'add_to', 'remove_from', 'clear'], placeholder: 'e.g. Platform' },
];

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

  const NO_VALUE_OPS = ['promote', 'demote', 'clear'];

  const needsValue = (op) => !NO_VALUE_OPS.includes(op);

  const userCurrencies = useMemo(() => {
    const currencies = new Map();
    for (const u of selectedUsers) {
      const cur = COUNTRY_CURRENCY[u.country] || 'Unknown';
      if (!currencies.has(cur)) currencies.set(cur, []);
      currencies.get(cur).push(u);
    }
    return currencies;
  }, [selectedUsers]);

  const hasMultipleCurrencies = userCurrencies.size > 1;

  const userCountries = useMemo(() => {
    const countries = new Set(selectedUsers.map((u) => u.country));
    return countries;
  }, [selectedUsers]);

  const userDepartments = useMemo(() => {
    const depts = new Set(selectedUsers.map((u) => u.department));
    return depts;
  }, [selectedUsers]);

  const activeConflict = useMemo(() => {
    if (!newField || selectedUsers.length === 0) return null;

    const currencySummary = [...userCurrencies.keys()].join(', ');

    if (newField === 'compensation' && hasMultipleCurrencies) {
      if (['increase_by', 'decrease_by', 'change_to'].includes(newOp)) {
        return {
          severity: 'error',
          title: 'Currency conflict',
          message: `Users have different currencies (${currencySummary}). Use a percentage operation or split by country.`,
        };
      }
      if (['increase_pct', 'decrease_pct'].includes(newOp)) {
        return {
          severity: 'warning',
          title: 'Multiple currencies',
          message: `Users paid in ${currencySummary}. Percentages work across currencies — verify this is intentional.`,
        };
      }
    }

    if (newField === 'currency' && hasMultipleCurrencies) {
      return {
        severity: 'error',
        title: 'Currency conflict',
        message: `Users already on different currencies (${currencySummary}). Process each group separately or adjust compensation in the same batch.`,
      };
    }

    if (newField === 'work_mode' && newOp === 'change_to' && userCountries.size > 1) {
      return {
        severity: 'warning',
        title: 'Multiple countries',
        message: `Users span ${userCountries.size} countries. Verify the work mode is feasible for all locations.`,
      };
    }

    if (newField === 'department' && newOp === 'change_to' && userDepartments.size > 1) {
      return {
        severity: 'warning',
        title: 'Cross-department change',
        message: `Users are in ${userDepartments.size} departments. This will affect reporting lines and cost centers.`,
      };
    }

    return null;
  }, [newField, newOp, selectedUsers, userCurrencies, hasMultipleCurrencies, userCountries, userDepartments]);

  const isBlocked = activeConflict?.severity === 'error';

  const validateValue = (fieldId, op, value) => {
    if (!needsValue(op)) return '';
    const f = FIELDS.find((x) => x.id === fieldId);
    if (!f || !value) return '';
    if (f.type === 'currency' && (op.includes('increase') || op.includes('decrease'))) {
      const n = parseFloat(value);
      if (isNaN(n) || n < 0) return 'Enter a valid positive number.';
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
    if (isBlocked) return;
    if (needsValue(newOp) && !newValue.trim()) {
      setNewValueError('Value is required.');
      return;
    }
    const err = validateValue(newField, newOp, newValue);
    setNewValueError(err);
    if (err) return;
    const field = FIELDS.find((f) => f.id === newField);
    setFieldEdits((prev) => [
      ...prev,
      { field: field?.label || newField, fieldId: newField, operation: newOp, value: needsValue(newOp) ? newValue : '' },
    ]);
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
          <div className="field-change-row">
            <select
              className="form-input"
              value={newField}
              onChange={(e) => {
                const id = e.target.value;
                setNewField(id);
                const ops = FIELDS.find((f) => f.id === id)?.operations || ['change_to'];
                setNewOp(ops[0]);
                setNewValue('');
                setNewValueError('');
              }}
            >
              <option value="">Select field</option>
              {FIELDS.map((f) => {
                const alreadyAdded = fieldEdits.some((e) => e.fieldId === f.id);
                return (
                  <option key={f.id} value={f.id} disabled={alreadyAdded}>
                    {f.label}{alreadyAdded ? ' (already added)' : ''}
                  </option>
                );
              })}
            </select>

            <select
              className="form-input"
              value={newOp}
              onChange={(e) => {
                setNewOp(e.target.value);
                if (NO_VALUE_OPS.includes(e.target.value)) {
                  setNewValue('');
                  setNewValueError('');
                }
              }}
            >
              {(FIELDS.find((f) => f.id === newField)?.operations || ['change_to']).map((op) => (
                <option key={op} value={op}>
                  {OP_LABELS[op] || op}
                </option>
              ))}
            </select>

            {needsValue(newOp) && (() => {
              const selectedField = FIELDS.find((f) => f.id === newField);
              if (selectedField?.type === 'select') {
                return (
                  <select
                    className={`form-input ${newValueError ? 'error' : ''}`}
                    value={newValue}
                    onChange={(e) => {
                      setNewValue(e.target.value);
                      setNewValueError('');
                    }}
                  >
                    <option value="">Select value</option>
                    {(selectedField.options || []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                );
              }
              return (
                <input
                  type="text"
                  className={`form-input ${newValueError ? 'error' : ''}`}
                  placeholder={selectedField?.placeholder || 'Value'}
                  value={newValue}
                  onChange={(e) => {
                    setNewValue(e.target.value);
                    setNewValueError(validateValue(newField, newOp, e.target.value));
                  }}
                />
              );
            })()}

            {!needsValue(newOp) && (
              <span className="field-change-no-value">No value needed</span>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddFieldEdit}
              disabled={isBlocked}
            >
              Add change
            </button>
          </div>

          {activeConflict && (
            <div className={`conflict-banner conflict-banner--${activeConflict.severity}`}>
              <div className="conflict-banner-icon">
                {activeConflict.severity === 'error' ? '⛔' : '⚠️'}
              </div>
              <div className="conflict-banner-body">
                <strong className="conflict-banner-title">{activeConflict.title}</strong>
                <p className="conflict-banner-msg">{activeConflict.message}</p>
              </div>
            </div>
          )}

          {newValueError && <p className="error-message">{newValueError}</p>}
          {fieldEdits.length > 0 && (
            <div className="field-edits-list">
              {fieldEdits.map((e, i) => (
                <div key={i} className="field-edit-chip">
                  <span className="field-edit-chip-label">{e.field}</span>
                  <span className="field-edit-chip-op">{OP_LABELS[e.operation] || e.operation}</span>
                  {e.value && <span className="field-edit-chip-value">{e.value}</span>}
                  <button type="button" className="field-edit-chip-remove" onClick={() => handleRemoveFieldEdit(i)} aria-label="Remove">
                    &times;
                  </button>
                </div>
              ))}
            </div>
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
