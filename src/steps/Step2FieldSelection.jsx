import { useState, useMemo, useRef } from 'react';
import { useAppState } from '../context/AppState';
import * as XLSX from 'xlsx';

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ verticalAlign: 'middle' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

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
    parsedCsvData,
    setParsedCsvData,
    setValidationErrors,
    setExcludedUserIds,
    setCurrentStep,
    goToStep,
    selectedUsers,
  } = useAppState();

  const csvInputRef = useRef(null);

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

  const isStrictNumber = (v) => /^-?\d+(\.\d+)?$/.test(v.trim());
  const isStrictCurrency = (v) => /^\$?[\d,]+(\.\d{1,2})?$/.test(v.trim().replace(/\s/g, ''));

  const validateValue = (fieldId, op, value) => {
    if (!needsValue(op)) return '';
    const f = FIELDS.find((x) => x.id === fieldId);
    if (!f || !value) return '';

    if (f.type === 'currency' && op === 'change_to') {
      if (!isStrictCurrency(value)) return 'Enter a valid amount (numbers only, e.g. 50000 or $50,000).';
      const n = parseFloat(value.replace(/[$,]/g, ''));
      if (n < 0) return 'Amount cannot be negative.';
    }

    if (f.type === 'currency' && (op === 'increase_by' || op === 'decrease_by')) {
      if (!isStrictNumber(value)) return 'Enter a valid number (digits only, e.g. 5000).';
      const n = parseFloat(value);
      if (n <= 0) return 'Amount must be greater than 0.';
    }

    if (f.id === 'compensation' && (op === 'increase_pct' || op === 'decrease_pct')) {
      if (!isStrictNumber(value)) return 'Enter a valid number (digits only, e.g. 10).';
      const n = parseFloat(value);
      if (n <= 0 || n > 100) return 'Enter a percentage between 0 and 100.';
    }

    return '';
  };

  const duplicateFieldWarning = useMemo(() => {
    if (!newField) return null;
    const existing = fieldEdits.filter((e) => e.fieldId === newField);
    if (existing.length === 0) return null;
    const label = FIELDS.find((f) => f.id === newField)?.label || newField;
    return `"${label}" already has ${existing.length} edit(s). Adding another may cause conflicting changes.`;
  }, [newField, fieldEdits]);

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

  const EXPECTED_HEADERS = ['User ID', 'Name', 'Compensation', 'Title', 'Department', 'Location'];

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => line.split(',').map((c) => c.trim()));
    return { headers, rows };
  };

  const validateCsvContent = (headers, rows) => {
    const errors = [];

    const headerMismatch = EXPECTED_HEADERS.some((h, i) => (headers[i] || '').toLowerCase() !== h.toLowerCase());
    if (headerMismatch) {
      errors.push({ row: 1, col: '', type: 'format', message: `Expected headers: ${EXPECTED_HEADERS.join(', ')}` });
    }

    const selectedIds = new Set(selectedUsers.map((u) => u.id));

    rows.forEach((cols, i) => {
      const rowNum = i + 2;
      const userId = cols[0] || '';
      const name = cols[1] || '';
      const compensation = cols[2] || '';
      const title = cols[3] || '';
      const department = cols[4] || '';
      const location = cols[5] || '';

      if (!userId.trim()) {
        errors.push({ row: rowNum, col: 'User ID', type: 'validation', message: 'User ID is empty.' });
      } else if (!selectedIds.has(userId)) {
        errors.push({ row: rowNum, col: 'User ID', type: 'validation', message: `User "${userId}" not in selected users.` });
      }

      if (!name.trim()) {
        errors.push({ row: rowNum, col: 'Name', type: 'validation', message: 'Name is empty.' });
      }

      if (!compensation.trim()) {
        errors.push({ row: rowNum, col: 'Compensation', type: 'validation', message: 'Compensation is empty.' });
      } else {
        const n = parseFloat(compensation.replace(/[$,]/g, ''));
        if (isNaN(n) || n < 0) {
          errors.push({ row: rowNum, col: 'Compensation', type: 'validation', message: 'Must be a valid positive number.' });
        }
      }

      if (!title.trim()) {
        errors.push({ row: rowNum, col: 'Title', type: 'validation', message: 'Title is empty.' });
      }

      if (!department.trim()) {
        errors.push({ row: rowNum, col: 'Department', type: 'validation', message: 'Department is empty.' });
      }

      if (!location.trim()) {
        errors.push({ row: rowNum, col: 'Location', type: 'validation', message: 'Location is empty.' });
      }
    });

    return errors;
  };

  const ALLOWED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

  const parseXlsx = (buffer) => {
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (raw.length === 0) return { headers: [], rows: [] };
    let headers = raw[0].map(String);
    let rows = raw.slice(1).map((r) => r.map(String));

    // Strip the "Errors" column if this is a re-upload of the error file
    if (headers[0].toLowerCase() === 'errors') {
      headers = headers.slice(1);
      rows = rows.map((r) => r.slice(1));
    }

    return { headers, rows };
  };

  const processFileData = (headers, rows) => {
    const filteredRows = rows.filter((cols) => cols.some((c) => String(c).trim() !== ''));
    const totalRows = filteredRows.length;
    setParsedCsvData({ headers, rows: filteredRows });

    if (totalRows === 0) {
      setCsvValidation({ valid: false, totalRows: 0, errorCount: 1, errors: [{ row: 0, col: '', type: 'format', message: 'File has no data rows.' }] });
      setShowCsvErrors(true);
      return;
    }

    const errors = validateCsvContent(headers, filteredRows);
    const errorRows = new Set(errors.map((err) => err.row));

    if (errors.length === 0) {
      setCsvValidation({ valid: true, totalRows, errorCount: 0, errors: [] });
      setShowCsvErrors(false);
    } else {
      setCsvValidation({ valid: false, totalRows, errorCount: errorRows.size, errors });
      setShowCsvErrors(true);
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setCsvValidation({ valid: false, totalRows: 0, errorCount: 1, errors: [{ row: 0, col: '', type: 'format', message: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 5 MB limit. Please reduce the file size and try again.` }] });
      setShowCsvErrors(true);
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setCsvValidation({ valid: false, totalRows: 0, errorCount: 1, errors: [{ row: 0, col: '', type: 'format', message: 'File must be .csv, .xls, or .xlsx.' }] });
      setShowCsvErrors(true);
      return;
    }

    setCsvFile(file);

    if (ext === '.csv') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result || '';
        let { headers, rows } = parseCsv(text);
        if (headers[0]?.toLowerCase() === 'errors') {
          headers = headers.slice(1);
          rows = rows.map((r) => r.slice(1));
        }
        processFileData(headers, rows);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const buffer = new Uint8Array(evt.target?.result);
        const { headers, rows } = parseXlsx(buffer);
        processFileData(headers, rows);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['User ID', 'Name', 'Compensation', 'Title', 'Department', 'Location'];
    const rows = selectedUsers.map((u) => [u.id, u.name, '100000', u.role || 'Employee', u.department, u.country || '']);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_update_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadErrorCsv = () => {
    if (!csvValidation?.errors?.length || !parsedCsvData) return;

    const { headers, rows } = parsedCsvData;

    const errorsByRow = new Map();
    csvValidation.errors.forEach((err) => {
      if (!errorsByRow.has(err.row)) errorsByRow.set(err.row, []);
      errorsByRow.get(err.row).push(err);
    });

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const ERR_BG = '#FEE2E2';
    const ERR_BORDER = '#FCA5A5';
    const OK_BG = '#D1FAE5';
    const OK_BORDER = '#6EE7B7';
    const HEADER_BG = '#F3F4F6';
    const BORDER = '#D1D5DB';

    let tableRows = '';

    tableRows += '<tr>';
    tableRows += `<th style="background:${HEADER_BG};border:1px solid ${BORDER};padding:6px 10px;font-weight:bold;">Errors</th>`;
    headers.forEach((h) => {
      tableRows += `<th style="background:${HEADER_BG};border:1px solid ${BORDER};padding:6px 10px;font-weight:bold;">${esc(h)}</th>`;
    });
    tableRows += '</tr>';

    rows.forEach((cols, i) => {
      const rowNum = i + 2;
      const rowErrors = errorsByRow.get(rowNum);
      const hasErrors = rowErrors && rowErrors.length > 0;

      tableRows += '<tr>';

      if (hasErrors) {
        const errorColNames = new Set(rowErrors.map((e) => e.col));
        const errorDesc = rowErrors.map((e, idx) => `${idx + 1}. ${e.col}: ${e.message}`).join('<br/>');
        tableRows += `<td style="background:${ERR_BG};border:1px solid ${ERR_BORDER};padding:6px 10px;color:#991B1B;font-size:12px;white-space:normal;">${errorDesc}</td>`;
        headers.forEach((h, ci) => {
          const val = cols[ci] || '';
          const isErr = errorColNames.has(h);
          const bg = isErr ? `background:${ERR_BG};border:1px solid ${ERR_BORDER};` : `border:1px solid ${BORDER};`;
          const color = isErr ? 'color:#991B1B;' : '';
          tableRows += `<td style="${bg}padding:6px 10px;${color}">${esc(val)}</td>`;
        });
      } else {
        tableRows += `<td style="background:${OK_BG};border:1px solid ${OK_BORDER};padding:6px 10px;color:#065F46;font-size:12px;">No errors found</td>`;
        headers.forEach((_, ci) => {
          const val = cols[ci] || '';
          tableRows += `<td style="border:1px solid ${BORDER};padding:6px 10px;">${esc(val)}</td>`;
        });
      }

      tableRows += '</tr>';
    });

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;}th,td{white-space:nowrap;}</style></head>
<body><table>${tableRows}</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = csvFile?.name?.replace(/\.[^.]+$/, '') || 'bulk_update';
    a.download = `${baseName}_error_sheet.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinueWithExclusions = () => {
    if (csvValidation?.errors?.length && parsedCsvData) {
      const errorRowNums = new Set(csvValidation.errors.map((e) => e.row));
      const errorUserIds = [];
      parsedCsvData.rows.forEach((cols, i) => {
        if (errorRowNums.has(i + 2)) {
          const uid = String(cols[0] || '').trim();
          if (uid) errorUserIds.push(uid);
        }
      });
      setExcludedUserIds(errorUserIds);
    }
    setValidationErrors([]);
    setShowCsvErrors(false);
    setCurrentStep(3);
  };

  const handleReupload = () => {
    setCsvFile(null);
    setCsvValidation(null);
    setParsedCsvData(null);
    setShowCsvErrors(false);
    setCsvExcludeRows(false);
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
      csvInputRef.current.click();
    }
  };

  const canProceedFilters = editMethod === 'filters' && fieldEdits.length > 0;
  const canProceedCsv = editMethod === 'csv' && csvFile && (csvValidation?.valid || csvExcludeRows);
  const canProceed = canProceedFilters || canProceedCsv;

  const allRowsHaveErrors = csvValidation && !csvValidation.valid &&
    csvValidation.errorCount >= (csvValidation.totalRows || 0);
  const validRowCount = csvValidation
    ? (csvValidation.totalRows || 0) - (csvValidation.errorCount || 0)
    : 0;

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
              className="btn btn-primary"
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

          {duplicateFieldWarning && (
            <div className="conflict-banner conflict-banner--warning" style={{ marginTop: '0.5rem' }}>
              <div className="conflict-banner-icon">⚠️</div>
              <div className="conflict-banner-body">
                <strong className="conflict-banner-title">Duplicate field edit</strong>
                <p className="conflict-banner-msg">{duplicateFieldWarning}</p>
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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <label className="btn btn-primary" style={{ margin: 0, cursor: 'pointer' }}>
              Upload CSV / Excel
              <input ref={csvInputRef} type="file" accept=".csv,.xls,.xlsx" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
            <button type="button" className="btn-link-download" onClick={handleDownloadTemplate}>
              Download CSV template <DownloadIcon />
            </button>
          </div>
          {csvFile && <p style={{ margin: 0, fontSize: '0.9rem' }}>Uploaded: <em>{csvFile.name}</em></p>}

          {csvFile && csvValidation?.valid && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#065F46' }}>
              <span style={{ fontWeight: 600 }}>&#10003;</span> All {csvValidation.totalRows} row(s) validated — ready to preview.
            </div>
          )}

          {showCsvErrors && csvValidation && !csvValidation.valid && (
            <div className="card" style={{ marginTop: '1rem', borderColor: 'var(--error)', background: '#fef2f2' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--error)' }}>Validation results</h4>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem' }}>
                {csvValidation.errorCount} of {csvValidation.totalRows} row(s) have errors.
                {allRowsHaveErrors
                  ? ' All rows have issues — please fix and re-upload.'
                  : ` ${validRowCount} valid row(s) can proceed.`}
                {' '}
                <button type="button" className="btn-link-download" onClick={handleDownloadErrorCsv}>
                  Download error CSV <DownloadIcon />
                </button>
              </p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={allRowsHaveErrors}
                  onClick={() => { setCsvExcludeRows(true); handleContinueWithExclusions(); }}
                >
                  Continue with {validRowCount} valid row(s)
                </button>
                <button type="button" className="btn btn-primary" onClick={handleReupload}>
                  Re-upload corrected CSV
                </button>
              </div>
              {allRowsHaveErrors && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--error)' }}>
                  Cannot continue — no valid rows to process.
                </p>
              )}
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
          onClick={() => setCurrentStep(3)}
        >
          Preview changes
        </button>
      </div>
    </>
  );
}
