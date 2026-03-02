import { useState, useRef, useEffect } from 'react';

/**
 * Typeable dropdown: user can type to filter options and select from the list.
 */
export function Combobox({ options, value, onChange, placeholder = 'Type or select...', className = '', id }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const normalizedOptions = options.map((o) => (typeof o === 'string' ? o : o.value || o.label));
  const filtered = inputValue.trim()
    ? normalizedOptions.filter((opt) => opt.toLowerCase().includes(inputValue.toLowerCase()))
    : normalizedOptions;

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt);
    setInputValue(opt);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setOpen(true);
    if (normalizedOptions.includes(e.target.value)) {
      onChange(e.target.value);
    } else {
      onChange('');
    }
  };

  const handleFocus = () => setOpen(true);
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0]);
  };

  return (
    <div className={`combobox ${className}`} ref={containerRef}>
      <input
        id={id}
        type="text"
        className="form-input combobox-input"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && (
        <ul className="combobox-list" role="listbox">
          {filtered.length === 0 ? (
            <li className="combobox-item combobox-item--empty">No matches</li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={value === opt}
                className={`combobox-item ${value === opt ? 'combobox-item--selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
