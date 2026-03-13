import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';

const STEP_LABELS = [
  'User Selection',
  'Field Selection & Edit',
  'Preview Changes',
  'Approval & Notify',
];

const defaultUser = (id, name, role, department, country) => ({
  id,
  name,
  role: role || 'Employee',
  department: department || 'Engineering',
  country: country || 'USA',
});

const MOCK_USERS = [
  // Product roles
  defaultUser('E001', 'Alice Chen', 'PM', 'Product', 'USA'),
  defaultUser('E002', 'Bob Smith', 'APM', 'Product', 'India'),
  defaultUser('E003', 'Carol Jones', 'SPM', 'Product', 'USA'),
  defaultUser('E005', 'Eve Wilson', 'PM L2', 'Product', 'UK'),
  defaultUser('E007', 'Grace Kim', 'PM L1', 'Product', 'India'),
  defaultUser('E009', 'Ivy Martinez', 'Senior PM', 'Product', 'USA'),
  defaultUser('E010', 'Jack Wilson', 'APM L3', 'Product', 'India'),
  defaultUser('E011', 'Kate Brown', 'Lead PM L1', 'Product', 'UK'),
  defaultUser('E015', 'Liam Patel', 'SPM L2', 'Product', 'India'),
  defaultUser('E016', 'Mia Zhang', 'Lead PM', 'Product', 'Singapore'),
  defaultUser('E017', 'Noah Garcia', 'APM L1', 'Product', 'USA'),
  defaultUser('E018', 'Olivia Park', 'Senior PM L3', 'Product', 'Japan'),
  // Tech roles
  defaultUser('E004', 'David Lee', 'Frontend Engineer', 'Engineering', 'India'),
  defaultUser('E006', 'Frank Brown', 'UI Designer', 'Design', 'USA'),
  defaultUser('E008', 'Henry Davis', 'Backend Engineer', 'Engineering', 'USA'),
  defaultUser('E012', 'Raj Mehta', 'Frontend Engineer L2', 'Engineering', 'India'),
  defaultUser('E013', 'Sara Tanaka', 'DevOps Engineer', 'Engineering', 'Japan'),
  defaultUser('E014', 'Tom Schulz', 'QA Engineer L1', 'Engineering', 'Germany'),
  defaultUser('E019', 'Uma Reddy', 'Backend Engineer L3', 'Engineering', 'India'),
  defaultUser('E020', 'Viktor Novak', 'Data Scientist', 'Engineering', 'UK'),
  defaultUser('E021', 'Wendy Liu', 'Data Scientist L2', 'Engineering', 'Singapore'),
  defaultUser('E022', 'Xander Cole', 'DevOps Engineer L1', 'Engineering', 'USA'),
  defaultUser('E023', 'Yuki Sato', 'UX Designer', 'Design', 'Japan'),
  defaultUser('E024', 'Zara Khan', 'UI Designer L2', 'Design', 'India'),
  defaultUser('E025', 'Ben Torres', 'UX Designer L1', 'Design', 'Mexico'),
  // Other departments
  defaultUser('E026', 'Chloe Adams', 'Sales Lead', 'Sales', 'USA'),
  defaultUser('E027', 'Derek Obi', 'Marketing Manager', 'Marketing', 'UK'),
  defaultUser('E028', 'Elena Rossi', 'HR Specialist', 'HR', 'Italy'),
  defaultUser('E029', 'Faisal Ahmed', 'Finance Analyst', 'Finance', 'India'),
  defaultUser('E030', 'Gina Muller', 'Support Lead', 'Support', 'Germany'),
  defaultUser('E031', 'Hiro Nakamura', 'Operations Manager', 'Operations', 'Japan'),
  defaultUser('E032', 'Isabel Fernandez', 'Legal Counsel', 'Legal', 'Spain'),
  defaultUser('E033', 'James Wright', 'Sales Rep', 'Sales', 'Australia'),
  defaultUser('E034', 'Karen Lim', 'Marketing Analyst', 'Marketing', 'Singapore'),
  defaultUser('E035', 'Lucas Silva', 'HR Manager', 'HR', 'Brazil'),
];

// --- Role hierarchy definitions ---
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

function allRolesForCategory(cat) {
  const h = ROLE_HIERARCHY[cat];
  if (!h) return [];
  return [...h.mainRoles, ...h.mainRoles.flatMap(h.subRolesPerMain)];
}

function mainRoleFromRole(role, cat) {
  if (!role) return '';
  const h = ROLE_HIERARCHY[cat];
  if (!h) return role;
  for (const main of h.mainRoles) {
    if (role === main) return main;
    if (h.subRolesPerMain(main).includes(role)) return main;
  }
  return role;
}

function isFilterIncomplete(f) {
  if (f.field === 'Country') return !f.value;
  if (f.field === 'Department') return !f.value;
  if (f.field === 'Role') {
    if (!f.roleCategory) return true;
    if (!f.allMainRoles && (f.mainRoles || []).length === 0 && (f.subRoles || []).length === 0) return true;
    return false;
  }
  return false;
}

function matchesFilter(u, f) {
  if (isFilterIncomplete(f)) return true;
  if (f.field === 'Country') return u.country === f.value;
  if (f.field === 'Department') return u.department === f.value;
  if (f.field === 'Role') {
    const cat = f.roleCategory;
    const allMain = f.allMainRoles;
    const mains = f.mainRoles || [];
    const subs = f.subRoles || [];
    const allCatRoles = allRolesForCategory(cat);
    const isInCategory = allCatRoles.includes(u.role);
    if (!isInCategory) return false;
    if (allMain) return true;
    const userMain = mainRoleFromRole(u.role, cat);
    if (mains.includes(userMain)) return true;
    if (subs.includes(u.role)) return true;
    return false;
  }
  return true;
}

function hasAnyCompleteFilter(filters) {
  return filters.some((f) => !isFilterIncomplete(f));
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [currentStep, setCurrentStepRaw] = useState(0);
  const skipPushRef = useRef(false);

  const setCurrentStep = useCallback((step) => {
    setCurrentStepRaw(step);
    if (!skipPushRef.current) {
      window.history.pushState({ step }, '', `#step-${step}`);
    }
    skipPushRef.current = false;
  }, []);

  useEffect(() => {
    window.history.replaceState({ step: 0 }, '', '#step-0');

    const handlePopState = (e) => {
      const step = e.state?.step ?? 0;
      skipPushRef.current = true;
      setCurrentStepRaw(step);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [submitted, setSubmitted] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState([]);
  const [filterUserCount, setFilterUserCount] = useState(0);
  const [editMethod, setEditMethod] = useState(null);
  const [fieldEdits, setFieldEdits] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [csvValidation, setCsvValidation] = useState(null);
  const [parsedCsvData, setParsedCsvData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [excludedUserIds, setExcludedUserIds] = useState([]);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [history, setHistory] = useState([]);

  const goToStep = useCallback((step) => {
    if (submitted && step >= 1 && step <= 4) return;
    setCurrentStep(step);
  }, [submitted]);

  const startNewBulkChange = useCallback(() => {
    setCurrentStep(1);
    setSubmitted(false);
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    setFilters([]);
    setFilterUserCount(0);
    setEditMethod(null);
    setFieldEdits([]);
    setCsvFile(null);
    setCsvValidation(null);
    setParsedCsvData(null);
    setValidationErrors([]);
    setExcludedUserIds([]);
    setConfirmChecked(false);
    setRequestId(null);
    setApprovalStatus(null);
  }, []);

  const addUser = useCallback((user) => {
    setSelectedUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      if (prev.length >= 500) return prev;
      return [...prev, user];
    });
  }, []);

  const removeUser = useCallback((userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const clearAllUsers = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  const addFilter = useCallback((filter) => {
    setFilters((prev) => [...prev, filter]);
  }, []);

  const updateFilter = useCallback((index, updates) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  }, []);

  const removeFilter = useCallback((index) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters([]);
    setFilterUserCount(0);
  }, []);

  useEffect(() => {
    if (filters.length === 0) {
      setFilterUserCount(0);
      return;
    }
    const count = MOCK_USERS.filter((u) => filters.every((f) => matchesFilter(u, f))).length;
    setFilterUserCount(count);
  }, [filters]);

  const filterNewCount = useMemo(() => {
    if (filters.length === 0) return 0;
    const existingIds = new Set(selectedUsers.map((u) => u.id));
    return MOCK_USERS.filter((u) => filters.every((f) => matchesFilter(u, f)) && !existingIds.has(u.id)).length;
  }, [filters, selectedUsers]);

  const selectedUserIdsKey = useMemo(
    () => selectedUsers.map((u) => u.id).sort().join(','),
    [selectedUsers]
  );

  useEffect(() => {
    setCsvFile(null);
    setCsvValidation(null);
    setParsedCsvData(null);
    setExcludedUserIds([]);
    setValidationErrors([]);
  }, [selectedUserIdsKey]);

  const applyFilterSelection = useCallback(() => {
    const fromFilter = MOCK_USERS.filter((u) => filters.every((f) => matchesFilter(u, f)));
    setSelectedUsers((prev) => {
      const existingIds = new Set(prev.map((u) => u.id));
      const toAdd = fromFilter.filter((u) => !existingIds.has(u.id));
      return [...prev, ...toAdd].slice(0, 500);
    });
  }, [filters]);

  const CRITICAL_FIELDS = ['compensation', 'currency', 'status'];
  const CRITICAL_LABELS = ['Compensation', 'Pay Currency', 'Status'];

  const submitForApproval = useCallback((opts = {}) => {
    const { changedFieldNames = [], requiresApproval = true, scheduledDate = null } = opts;

    const id = `REQ-${Date.now()}`;
    setRequestId(id);
    setSubmitted(true);

    const fieldsStr = changedFieldNames.length > 0
      ? changedFieldNames.join(', ')
      : fieldEdits.map((e) => e.field).join(', ') || '—';

    const effCount = selectedUsers.length - excludedUserIds.length;

    const baseEntry = {
      requestId: id,
      submittedBy: 'Current User',
      date: new Date().toISOString(),
      userCount: effCount,
      fieldsChanged: fieldsStr,
      users: selectedUsers.filter((u) => !excludedUserIds.includes(u.id)),
      fieldEdits: [...fieldEdits],
      editMethod,
      parsedCsvData,
    };

    if (scheduledDate && requiresApproval) {
      setApprovalStatus('scheduled_pending');
      setHistory((prev) => [
        ...prev,
        {
          ...baseEntry,
          status: 'Scheduled – Pending Approval',
          statusDetail: `Scheduled for ${new Date(scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · Awaiting approval`,
          scheduledDate,
        },
      ]);
      setCurrentStep(4);
    } else if (scheduledDate) {
      setApprovalStatus('scheduled');
      setHistory((prev) => [
        ...prev,
        {
          ...baseEntry,
          status: 'Scheduled',
          statusDetail: `Scheduled for ${new Date(scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          scheduledDate,
        },
      ]);
      setCurrentStep(4);
    } else if (requiresApproval) {
      setApprovalStatus('pending');
      setHistory((prev) => [
        ...prev,
        {
          ...baseEntry,
          status: 'pending',
          statusDetail: 'Pending approval — critical fields changed',
        },
      ]);
      setCurrentStep(4);
    } else {
      setApprovalStatus('processing');
      setHistory((prev) => [
        ...prev,
        {
          ...baseEntry,
          status: 'Processing',
          statusDetail: 'Applying changes…',
        },
      ]);
      setCurrentStep(4);
    }
  }, [selectedUsers, excludedUserIds, fieldEdits, editMethod, parsedCsvData]);

  const effectiveUserCount = selectedUsers.filter((u) => !excludedUserIds.includes(u.id)).length;

  return (
    <AppStateContext.Provider
      value={{
        STEP_LABELS,
        currentStep,
        setCurrentStep,
        goToStep,
        submitted,
        selectedUsers,
        setSelectedUsers,
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
        filterNewCount,
        setFilterUserCount,
        applyFilterSelection,
        addUser,
        removeUser,
        clearAllUsers,
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
        validationErrors,
        setValidationErrors,
        excludedUserIds,
        setExcludedUserIds,
        confirmChecked,
        setConfirmChecked,
        requestId,
        approvalStatus,
        setApprovalStatus,
        history,
        setHistory,
        submitForApproval,
        startNewBulkChange,
        effectiveUserCount,
        MOCK_USERS,
        CRITICAL_FIELDS,
        CRITICAL_LABELS,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
