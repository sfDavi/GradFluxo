import type { Nucleo, Status } from '../types';

interface FilterChipsProps {
  activeNucleos: Set<Nucleo>;
  activeStatuses: Set<Status>;
  onToggleNucleo: (nucleo: Nucleo) => void;
  onToggleStatus: (status: Status) => void;
  onClearFilters: () => void;
  matchCount: number | null;
  totalCount: number;
}

const nucleoOptions: { value: Nucleo; label: string; cssVar: string }[] = [
  { value: 'comum', label: 'Comum', cssVar: 'var(--nucleo-comum)' },
  { value: 'especifico', label: 'Específico', cssVar: 'var(--nucleo-especifico)' },
  { value: 'livre', label: 'Livre', cssVar: 'var(--nucleo-livre)' },
  { value: 'optativo', label: 'Optativo', cssVar: 'var(--nucleo-optativo)' },
];

const statusOptions: { value: Status; label: string; cssVar: string }[] = [
  { value: 'cursada', label: 'Cursada', cssVar: 'var(--status-cursada)' },
  { value: 'cursavel', label: 'Cursável', cssVar: 'var(--status-cursavel)' },
  { value: 'nao_cursavel', label: 'Não Cursável', cssVar: 'var(--status-locked)' },
];

export function FilterChips({
  activeNucleos,
  activeStatuses,
  onToggleNucleo,
  onToggleStatus,
  onClearFilters,
  matchCount,
  totalCount,
}: FilterChipsProps) {
  const hasActiveFilters = activeNucleos.size > 0 || activeStatuses.size > 0;

  return (
    <div className="filter-chips">
      <div className="filter-group">
        <span className="filter-group-label">Núcleo</span>
        <div className="filter-group-chips">
          {nucleoOptions.map((opt) => (
            <button
              key={opt.value}
              className={`filter-chip${activeNucleos.has(opt.value) ? ' is-active' : ''}`}
              style={{
                '--chip-color': opt.cssVar,
              } as React.CSSProperties}
              onClick={() => onToggleNucleo(opt.value)}
            >
              <span className="filter-chip-dot" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-group-label">Status</span>
        <div className="filter-group-chips">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              className={`filter-chip${activeStatuses.has(opt.value) ? ' is-active' : ''}`}
              style={{
                '--chip-color': opt.cssVar,
              } as React.CSSProperties}
              onClick={() => onToggleStatus(opt.value)}
            >
              <span className="filter-chip-dot" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {hasActiveFilters && (
        <div className="filter-meta">
          <span className="filter-match-count">
            {matchCount !== null ? matchCount : totalCount} / {totalCount} disciplinas
          </span>
          <button className="filter-clear" onClick={onClearFilters}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
