import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppState } from '../context/AppState';
import { Combobox } from '../components/Combobox';
import * as XLSX from 'xlsx';

const MAX_USERS = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

const FIELD_OPTIONS = ['Country', 'Role', 'Department'];
const COUNTRY_OPTIONS = ['India', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Singapore', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Netherlands'];
const DEPARTMENT_OPTIONS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Support', 'Legal'];
const ROLE_CATEGORIES = [
  { value: 'Product', label: 'Product' },
  { value: 'Tech', label: 'Tech' },
  { value: 'Design', label: 'Design' },
];

const ROLE_HIERARCHY = {
  Product: {
    mainRoles: ['APM', 'PM', 'SPM', 'Senior PM', 'Lead PM'],
    subRolesPerMain: (main) => [`${main} L1`, `${main} L2`, `${main} L3`],
  },
  Tech: {
    mainRoles: ['Frontend Engineer', 'Backend Engineer', 'DevOps Engineer', 'QA Engineer', 'Data Scientist'],
    subRolesPerMain: (main) => [`${main} L1`, `${main} L2`, `${main} L3`],
  },
  Design: {
    mainRoles: ['UI Designer', 'UX Designer'],
    subRolesPerMain: (main) => [`${main} L1`, `${main} L2`, `${main} L3`],
  },
};

function getMainRolesForCategory(cat) {
  const h = ROLE_HIERARCHY[cat];
  if (!h) return [];
  return h.mainRoles.map((main) => ({ main, subs: h.subRolesPerMain(main) }));
}

function selectedRoleSummary(f) {
  const cat = f.roleCategory || 'Product';
  if (f.allMainRoles) return `All ${cat} roles`;
  const mains = f.mainRoles || [];
  const subs = f.subRoles || [];
  const parts = [...mains, ...subs];
  if (parts.length === 0) return 'Select roles...';
  if (parts.length <= 2) return parts.join(', ');
  return `${parts.slice(0, 2).join(', ')} +${parts.length - 2} more`;
}

function RoleDropdownPanel({ filter: f, rowIndex, updateFilter }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const cat = f.roleCategory || 'Product';
  const roles = getMainRolesForCategory(cat);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="role-dropdown" ref={containerRef}>
      <button
        type="button"
        className="role-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="role-dropdown-trigger-text">{selectedRoleSummary(f)}</span>
        <span className="role-dropdown-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="role-dropdown-panel">
          <label className="role-dropdown-all">
            <input
              type="checkbox"
              checked={f.allMainRoles || false}
              onChange={(e) => updateFilter(rowIndex, {
                allMainRoles: e.target.checked,
                mainRoles: [],
                subRoles: [],
              })}
            />{' '}
            All {roles.length} main roles
          </label>
          {!f.allMainRoles && (
            <div className="role-dropdown-list">
              {roles.map(({ main, subs }) => {
                const mainChecked = (f.mainRoles || []).includes(main);
                return (
                  <div key={main} className="role-dropdown-group">
                    <label className="role-dropdown-main">
                      <input
                        type="checkbox"
                        checked={mainChecked}
                        onChange={(e) => {
                          const nextMain = e.target.checked
                            ? [...(f.mainRoles || []), main]
                            : (f.mainRoles || []).filter((x) => x !== main);
                          const nextSub = e.target.checked
                            ? (f.subRoles || []).filter((s) => !subs.includes(s))
                            : (f.subRoles || []);
                          updateFilter(rowIndex, { mainRoles: nextMain, subRoles: nextSub });
                        }}
                      />{' '}
                      {main}
                    </label>
                    <div className="role-dropdown-subs">
                      {subs.map((sub) => (
                        <label key={sub} className="role-dropdown-sub">
                          <input
                            type="checkbox"
                            disabled={mainChecked}
                            checked={mainChecked || (f.subRoles || []).includes(sub)}
                            onChange={(e) => {
                              const nextSub = e.target.checked
                                ? [...(f.subRoles || []), sub]
                                : (f.subRoles || []).filter((x) => x !== sub);
                              updateFilter(rowIndex, { subRoles: nextSub });
                            }}
                          />{' '}
                          {sub}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Step1UserSelection() {
  const {
    selectedUsers,
    addUser,
    removeUser,
    clearAllUsers,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    filterUserCount,
    filterNewCount,
    applyFilterSelection,
    setCurrentStep,
    MOCK_USERS,
  } = useAppState();

  const [activeTab, setActiveTab] = useState('search');
  const [showMaxWarning, setShowMaxWarning] = useState(false);

  // CSV upload state
  const [csvFile, setCsvFile] = useState(null);
  const [csvError, setCsvError] = useState('');
  const [csvParsedUsers, setCsvParsedUsers] = useState(null);
  const [csvValidationErrors, setCsvValidationErrors] = useState([]);
  const [csvAllRows, setCsvAllRows] = useState([]);
  const csvInputRef = useRef(null);

  const handleDownloadSample = useCallback(() => {
    const sampleIds = MOCK_USERS.slice(0, 3).map((u) => u.id);
    const rows = ['User ID', ...sampleIds].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_ids_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [MOCK_USERS]);

  const handleCsvUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError('');
    setCsvParsedUsers(null);
    setCsvValidationErrors([]);

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setCsvError(`Invalid file format (${ext}). Please upload .csv, .xls, or .xlsx files only.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setCsvError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 5 MB allowed.`);
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let ids = [];

        const trimCell = (s) => String(s).replace(/^["']|["']$/g, '').trim();

        if (ext === '.csv') {
          const text = evt.target.result;
          const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          if (lines.length === 0) { setCsvError('File is empty.'); return; }
          const headerCells = lines[0].split(',').map(trimCell);
          const stripErrorsCol = headerCells[0].toLowerCase() === 'errors';
          const headers = stripErrorsCol ? headerCells.slice(1) : headerCells;
          if ((headers[0] || '').toLowerCase() !== 'user id') {
            setCsvError(`Invalid header: "${headers[0] || headerCells[0]}". Expected "User ID".`);
            return;
          }
          const idColIndex = stripErrorsCol ? 1 : 0;
          ids = lines.slice(1).map((l) => l.split(',').map(trimCell)[idColIndex] || '').filter(Boolean);
        } else {
          const data = new Uint8Array(evt.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (rows.length === 0) { setCsvError('File is empty.'); return; }
          const rawHeaderRow = (rows[0] || []).map((c) => trimCell(String(c)));
          let idColIndex = 0;
          if (rawHeaderRow[0]?.toLowerCase() === 'errors') {
            idColIndex = 1;
          }
          const header = rawHeaderRow[idColIndex] || '';
          if (header.toLowerCase() !== 'user id') {
            setCsvError(`Invalid header: "${header}". Expected "User ID".`);
            return;
          }
          ids = rows.slice(1).map((r) => trimCell(String((Array.isArray(r) ? r[idColIndex] : r) || ''))).filter(Boolean);
        }

        if (ids.length === 0) {
          setCsvError('No user IDs found in the file. Add User IDs below the header row.');
          return;
        }

        const errors = [];
        const validUsers = [];
        const allRows = [];
        const seen = new Set();

        ids.forEach((id, i) => {
          const rowNum = i + 2;
          if (seen.has(id.toLowerCase())) {
            const reason = 'Duplicate ID in file';
            errors.push({ row: rowNum, id, reason });
            allRows.push({ rowNum, id, hasError: true, reason });
            return;
          }
          seen.add(id.toLowerCase());

          const user = MOCK_USERS.find((u) => u.id.toLowerCase() === id.toLowerCase());
          if (!user) {
            const reason = 'User ID not found in system';
            errors.push({ row: rowNum, id, reason });
            allRows.push({ rowNum, id, hasError: true, reason });
            return;
          }
          if (selectedUsers.some((u) => u.id === user.id)) {
            const reason = 'Already in selected list';
            errors.push({ row: rowNum, id, reason });
            allRows.push({ rowNum, id, hasError: true, reason });
            return;
          }
          validUsers.push(user);
          allRows.push({ rowNum, id, hasError: false });
        });

        setCsvParsedUsers(validUsers);
        setCsvValidationErrors(errors);
        setCsvAllRows(allRows);
      } catch (err) {
        setCsvError('Failed to parse file. Please check the format and try again.');
      }
    };

    if (ext === '.csv') reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  }, [MOCK_USERS, selectedUsers]);

  const handleAddCsvUsers = useCallback(() => {
    if (!csvParsedUsers || csvParsedUsers.length === 0) return;
    const remaining = MAX_USERS - selectedUsers.length;
    const toAdd = csvParsedUsers.slice(0, remaining);
    toAdd.forEach((u) => addUser(u));
    if (csvParsedUsers.length > remaining) {
      setShowMaxWarning(true);
    }
    setCsvFile(null);
    setCsvParsedUsers(null);
    setCsvValidationErrors([]);
    setCsvAllRows([]);
    setCsvError('');
    if (csvInputRef.current) csvInputRef.current.value = '';
  }, [csvParsedUsers, selectedUsers.length, addUser]);

  const handleDownloadErrorSheet = useCallback(() => {
    if (csvAllRows.length === 0) return;

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
    tableRows += `<th style="background:${HEADER_BG};border:1px solid ${BORDER};padding:6px 10px;font-weight:bold;">User ID</th>`;
    tableRows += '</tr>';

    csvAllRows.forEach((row) => {
      tableRows += '<tr>';
      if (row.hasError) {
        const errorDesc = `1. User ID: ${row.reason}`;
        tableRows += `<td style="background:${ERR_BG};border:1px solid ${ERR_BORDER};padding:6px 10px;color:#991B1B;font-size:12px;white-space:normal;">${esc(errorDesc)}</td>`;
        tableRows += `<td style="background:${ERR_BG};border:1px solid ${ERR_BORDER};padding:6px 10px;color:#991B1B;">${esc(row.id)}</td>`;
      } else {
        tableRows += `<td style="background:${OK_BG};border:1px solid ${OK_BORDER};padding:6px 10px;color:#065F46;font-size:12px;">No errors found</td>`;
        tableRows += `<td style="border:1px solid ${BORDER};padding:6px 10px;">${esc(row.id)}</td>`;
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
    a.download = 'user_upload_errors.xls';
    a.click();
    URL.revokeObjectURL(url);
  }, [csvAllRows]);

  const handleCsvReset = useCallback(() => {
    setCsvFile(null);
    setCsvParsedUsers(null);
    setCsvValidationErrors([]);
    setCsvAllRows([]);
    setCsvError('');
    if (csvInputRef.current) csvInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (activeTab === 'filters' && filters.length === 0) {
      addFilter({ field: 'Country', value: '' });
    }
  }, [activeTab, filters.length, addFilter]);

  const usedFields = filters.map((f) => f.field);
  const availableFields = FIELD_OPTIONS.filter((f) => !usedFields.includes(f));

  const handleAddNewFilter = () => {
    const nextField = availableFields[0] || FIELD_OPTIONS[0];
    if (nextField === 'Role') {
      addFilter({ field: 'Role', roleCategory: '', allMainRoles: false, mainRoles: [], subRoles: [] });
    } else if (nextField === 'Country') {
      addFilter({ field: 'Country', value: '' });
    } else {
      addFilter({ field: 'Department', value: '' });
    }
  };

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.country?.toLowerCase().includes(q)
    );
  }, [searchQuery, MOCK_USERS]);

  useEffect(() => {
    setSearchResults(searchFiltered);
  }, [searchFiltered, setSearchResults]);

  const handleAddUser = (user) => {
    if (selectedUsers.length >= MAX_USERS) {
      setShowMaxWarning(true);
      return;
    }
    addUser(user);
    setShowMaxWarning(false);
  };

  const handleApplyFilters = () => {
    applyFilterSelection();
  };

  const canContinue = selectedUsers.length > 0;
  const isDuplicate = (user) => selectedUsers.some((u) => u.id === user.id);

  return (
    <>
      <header className="step-header">

        <h1 className="step-title">User Selection</h1>
        <p className="step-description">
          Select the users for whom you want to make edits. Use search or filters to add to your list.
        </p>
      </header>

      <div className="user-selection-layout">
        <div className="user-selection-add">
          <div className="card">
            <h3 className="user-selection-add-title">Add users to list</h3>
            <div className="mode-tabs" role="tablist" aria-label="User selection method">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'search'}
                className={`mode-tab ${activeTab === 'search' ? 'mode-tab--active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                Search by name or ID
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'filters'}
                className={`mode-tab ${activeTab === 'filters' ? 'mode-tab--active' : ''}`}
                onClick={() => setActiveTab('filters')}
              >
                Add by filters
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'csv'}
                className={`mode-tab ${activeTab === 'csv' ? 'mode-tab--active' : ''}`}
                onClick={() => setActiveTab('csv')}
              >
                Upload CSV
              </button>
            </div>

            {activeTab === 'search' && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="user-search">
                Search users
              </label>
              <input
                id="user-search"
                type="text"
                className="form-input"
                placeholder="Type name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="table-wrap" style={{ maxHeight: 200, overflow: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Region</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {searchQuery.trim() === '' ? (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        Type in the search box to see users (name, ID, role, or region).
                      </td>
                    </tr>
                  ) : searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        No results found. Try a different search.
                      </td>
                    </tr>
                  ) : (
                    searchResults.slice(0, 10).map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.country || user.department}</td>
                        <td>{user.role}</td>
                        <td>
                          {isDuplicate(user) ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Already added</span>
                          ) : (
                            <button type="button" className="btn btn-secondary" onClick={() => handleAddUser(user)}>
                              Add
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {showMaxWarning && (
              <p className="error-message" style={{ marginTop: '0.5rem' }}>
                Maximum {MAX_USERS} users allowed. Remove some to add more.
              </p>
            )}
          </>
        )}

        {activeTab === 'csv' && (
          <div className="csv-upload-section">
            <div className="csv-upload-intro">
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Upload a CSV or Excel file with a single column <strong>"User ID"</strong> to bulk-add users.
              </p>
              <button type="button" className="btn-link-download" onClick={handleDownloadSample}>
                Download sample file <DownloadIcon />
              </button>
            </div>

            <div
              className="csv-upload-dropzone"
              onClick={() => !csvParsedUsers && csvInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (csvParsedUsers) return;
                const dt = e.dataTransfer;
                if (dt.files?.length) {
                  const fakeEvent = { target: { files: dt.files } };
                  handleCsvUpload(fakeEvent);
                }
              }}
              style={{ cursor: csvParsedUsers ? 'default' : 'pointer' }}
            >
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                style={{ display: 'none' }}
                onChange={handleCsvUpload}
              />
              {!csvFile && !csvParsedUsers && (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                  <p style={{ margin: 0, fontWeight: 500 }}>Click to upload or drag & drop</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    .csv, .xls, .xlsx — Max 5 MB — Max {MAX_USERS} users
                  </p>
                </div>
              )}

              {csvFile && csvParsedUsers && (
                <div style={{ padding: '0.75rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>📄 {csvFile.name}</span>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleCsvReset}>
                      Clear
                    </button>
                  </div>

                  {csvValidationErrors.length === 0 ? (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#065F46' }}>
                      <span style={{ fontWeight: 600 }}>&#10003;</span> All {csvParsedUsers.length} row(s) validated — ready to add.
                    </div>
                  ) : (
                    <div className="card" style={{ marginTop: '1rem', borderColor: 'var(--error)', background: '#fef2f2' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--error)' }}>Validation results</h4>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem' }}>
                        {csvValidationErrors.length} of {csvParsedUsers.length + csvValidationErrors.length} row(s) have errors.
                        {csvParsedUsers.length === 0
                          ? ' All rows have issues — please fix and re-upload.'
                          : ` ${csvParsedUsers.length} valid row(s) can proceed.`}
                        {' '}
                        <button type="button" className="btn-link-download" onClick={handleDownloadErrorSheet}>
                          Download error sheet <DownloadIcon />
                        </button>
                      </p>
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={csvParsedUsers.length === 0}
                          onClick={handleAddCsvUsers}
                        >
                          Add {csvParsedUsers.length} valid user{csvParsedUsers.length !== 1 ? 's' : ''} to the list
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => { handleCsvReset(); csvInputRef.current?.click(); }}>
                          Re-upload corrected CSV
                        </button>
                      </div>
                      {csvParsedUsers.length === 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--error)' }}>
                          Cannot continue — no valid users to add.
                        </p>
                      )}
                    </div>
                  )}

                  {csvValidationErrors.length === 0 && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddCsvUsers}
                      >
                        Add {csvParsedUsers.length} user{csvParsedUsers.length !== 1 ? 's' : ''} to the list
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => { handleCsvReset(); csvInputRef.current?.click(); }}>
                        Re-upload
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {csvError && (
              <div className="csv-upload-error">
                <span style={{ fontWeight: 600 }}>⚠ Upload failed</span>
                <p style={{ margin: '0.25rem 0 0' }}>{csvError}</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => {
                    setCsvError('');
                    setCsvFile(null);
                    csvInputRef.current?.click();
                  }}
                >
                  Re-upload correct file
                </button>
              </div>
            )}

            {showMaxWarning && (
              <p className="error-message" style={{ marginTop: '0.5rem' }}>
                Maximum {MAX_USERS} users allowed. Remove some to add more.
              </p>
            )}
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="filters-section">
            <div className="filter-rows">
              {filters.map((f, rowIndex) => {
                const fieldOptionsForRow = FIELD_OPTIONS.filter(
                  (field) => field === f.field || !filters.some((o, j) => j !== rowIndex && o.field === field)
                );
                return (
                  <div key={rowIndex} className="filter-row">
                    <div className="filter-row-fields">
                      <select
                        className="form-input filter-row-field"
                        value={f.field}
                        onChange={(e) => {
                          const newField = e.target.value;
                          if (newField === 'Country') updateFilter(rowIndex, { field: 'Country', value: '' });
                          else if (newField === 'Department') updateFilter(rowIndex, { field: 'Department', value: '' });
                          else updateFilter(rowIndex, { field: 'Role', roleCategory: '', allMainRoles: false, mainRoles: [], subRoles: [] });
                        }}
                      >
                        {fieldOptionsForRow.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {f.field === 'Country' && (
                        <div className="filter-row-value-wrap">
                          <Combobox
                            options={COUNTRY_OPTIONS}
                            value={f.value || ''}
                            onChange={(v) => updateFilter(rowIndex, { value: v })}
                            placeholder="Type or select country"
                            className="filter-row-value"
                          />
                        </div>
                      )}

                      {f.field === 'Department' && (
                        <div className="filter-row-value-wrap">
                          <Combobox
                            options={DEPARTMENT_OPTIONS}
                            value={f.value || ''}
                            onChange={(v) => updateFilter(rowIndex, { value: v })}
                            placeholder="Type or select dept"
                            className="filter-row-value"
                          />
                        </div>
                      )}

                      {f.field === 'Role' && (
                        <>
                          <div className="filter-row-value-wrap">
                            <Combobox
                              options={ROLE_CATEGORIES.map((r) => r.label)}
                              value={f.roleCategory || ''}
                              onChange={(v) => {
                                const cat = ROLE_CATEGORIES.find((r) => r.label === v)?.value || '';
                                updateFilter(rowIndex, { roleCategory: cat, allMainRoles: false, mainRoles: [], subRoles: [] });
                              }}
                              placeholder="Select category..."
                              className="filter-row-value"
                            />
                          </div>
                          {f.roleCategory && <RoleDropdownPanel filter={f} rowIndex={rowIndex} updateFilter={updateFilter} />}
                        </>
                      )}
                    </div>
                    {filters.length > 1 && (
                      <button
                        type="button"
                        className="filter-row-remove"
                        aria-label={`Remove ${f.field} filter`}
                        onClick={() => removeFilter(rowIndex)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {availableFields.length > 0 && (
              <button type="button" className="btn-link-add-filter" onClick={handleAddNewFilter}>
                + Add New filter
              </button>
            )}
            {filters.length > 1 && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                All filters are combined with AND logic.
              </p>
            )}
            <div className="filters-bottom-area">
              <div className="filters-bottom-meta">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Total users matching: <strong>{filterUserCount || '—'}</strong>
                </span>
                <button type="button" className="btn btn-icon-download" aria-label="Download user list" title="Download user list">
                  <DownloadIcon />
                </button>
              </div>
              <div className="filters-bottom-ctas">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={filterUserCount === 0 || filterNewCount === 0}
                  onClick={handleApplyFilters}
                >
                  {filterNewCount === 0 && filterUserCount > 0
                    ? 'All users already added'
                    : `Add ${filterNewCount} user(s) to the list`}
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>

        <div className="user-selection-list">
          <div className="card user-selection-list-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="user-selection-list-title" style={{ margin: 0 }}>Selected users ({selectedUsers.length})</h3>
              {selectedUsers.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', color: '#c0392b' }}
                  onClick={clearAllUsers}
                >
                  Remove All
                </button>
              )}
            </div>
            <p className="user-selection-list-hint">One list — add via search, filters, or CSV upload on the left.</p>
            {selectedUsers.length === 0 ? (
              <p className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No users yet. Use search, filters, or CSV upload to add users.</p>
            ) : (
              <div className="table-wrap user-selection-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.id}</td>
                        <td>{user.role}</td>
                        <td>{user.department}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => removeUser(user.id)}
                            aria-label={`Remove ${user.name}`}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canContinue}
          onClick={() => setCurrentStep(2)}
        >
          Continue to Field Selection
        </button>
      </div>
    </>
  );
}
