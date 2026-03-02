import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppState } from '../context/AppState';
import { Combobox } from '../components/Combobox';

const MAX_USERS = 500;

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
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    resetFilters,
    filterUserCount,
    applyFilterSelection,
    setCurrentStep,
    MOCK_USERS,
  } = useAppState();

  const [activeTab, setActiveTab] = useState('search');
  const [showMaxWarning, setShowMaxWarning] = useState(false);

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
    resetFilters();
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
                  disabled={filterUserCount === 0}
                  onClick={handleApplyFilters}
                >
                  Add users to the list
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>

        <div className="user-selection-list">
          <div className="card user-selection-list-card">
            <h3 className="user-selection-list-title">Selected users ({selectedUsers.length})</h3>
            <p className="user-selection-list-hint">One list — add via search or filters on the left.</p>
            {selectedUsers.length === 0 ? (
              <p className="empty-state">No users yet. Use search or filters to add users to this list.</p>
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
