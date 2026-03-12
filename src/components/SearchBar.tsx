import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchBarProps {
  onSearchChange: (term: string) => void;
}

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export { normalizeText };

export function SearchBar({ onSearchChange }: SearchBarProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearchChange(normalizeText(newValue.trim()));
      }, 200);
    },
    [onSearchChange]
  );

  const handleClear = useCallback(() => {
    setValue('');
    clearTimeout(timerRef.current);
    onSearchChange('');
    inputRef.current?.focus();
  }, [onSearchChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="search-bar">
      <svg
        className="search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder="Buscar disciplina… (Ctrl+K)"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />
      {value && (
        <button className="search-clear" onClick={handleClear} aria-label="Limpar busca">
          ✕
        </button>
      )}
    </div>
  );
}
