import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Curso, Disciplina, Nucleo, Status } from '../types';
import { calcularStatus } from '../utils/calcularStatus';
import { DisciplinaDrawer } from './DisciplinaDrawer';
import { ExportButton } from './ExportButton';
import { ImportButton } from './ImportButton';
import { FilterChips } from './FilterChips';
import { ProgressByNucleo } from './ProgressByNucleo';
import { SearchBar, normalizeText } from './SearchBar';

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  from: string;
  to: string;
}

function getStorageKey(codigoCurso: string): string {
  return `gradfluxo-cursadas-${codigoCurso}`;
}

function loadCursadas(codigoCurso: string): Set<string> {
  try {
    const stored = localStorage.getItem(getStorageKey(codigoCurso));
    if (stored) {
      const arr = JSON.parse(stored);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // ignore corrupted data
  }
  return new Set();
}

function saveCursadas(codigoCurso: string, cursadas: Set<string>): void {
  localStorage.setItem(getStorageKey(codigoCurso), JSON.stringify([...cursadas]));
}

interface FlowchartViewProps {
  curso: Curso;
  onBack: () => void;
}

const statusLabels: Record<Status, string> = {
  cursada: 'Cursada',
  cursavel: 'Cursável',
  nao_cursavel: 'Não cursável',
};

const nucleoLabels: Record<string, string> = {
  comum: 'Núcleo Comum',
  livre: 'Núcleo Livre',
  especifico: 'Núcleo Específico',
  optativo: 'Optativo',
};

export function FlowchartView({ curso, onBack }: FlowchartViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [cursadas, setCursadas] = useState<Set<string>>(() => loadCursadas(curso.codigoCurso));
  const [hoveredDisciplina, setHoveredDisciplina] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeNucleos, setActiveNucleos] = useState<Set<Nucleo>>(new Set());
  const [activeStatuses, setActiveStatuses] = useState<Set<Status>>(new Set());
  const [drawerDisciplina, setDrawerDisciplina] = useState<string | null>(null);

  const handleToggleNucleo = useCallback((nucleo: Nucleo) => {
    setActiveNucleos((prev) => {
      const next = new Set(prev);
      if (next.has(nucleo)) next.delete(nucleo);
      else next.add(nucleo);
      return next;
    });
  }, []);

  const handleToggleStatus = useCallback((status: Status) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveNucleos(new Set());
    setActiveStatuses(new Set());
  }, []);

  const hasFilters = activeNucleos.size > 0 || activeStatuses.size > 0;

  const statusMap = useMemo(
    () => calcularStatus(curso.disciplinas, cursadas),
    [curso.disciplinas, cursadas]
  );

  const searchMatches = useMemo(() => {
    if (!searchTerm) return null;
    const matches = new Set<string>();
    for (const d of curso.disciplinas) {
      const normalizedName = normalizeText(d.nomeDisciplina);
      const normalizedCode = normalizeText(d.codigoDisciplina);
      if (normalizedName.includes(searchTerm) || normalizedCode.includes(searchTerm)) {
        matches.add(d.codigoDisciplina);
      }
    }
    return matches;
  }, [curso.disciplinas, searchTerm]);

  const filterMatches = useMemo(() => {
    if (!hasFilters) return null;
    const matches = new Set<string>();
    for (const d of curso.disciplinas) {
      const nucleoOk = activeNucleos.size === 0 || activeNucleos.has(d.nucleo);
      const statusOk = activeStatuses.size === 0 || activeStatuses.has(statusMap.get(d.codigoDisciplina) || 'nao_cursavel');
      if (nucleoOk && statusOk) {
        matches.add(d.codigoDisciplina);
      }
    }
    return matches;
  }, [curso.disciplinas, activeNucleos, activeStatuses, hasFilters, statusMap]);

  const combinedMatches = useMemo(() => {
    if (!searchMatches && !filterMatches) return null;
    if (searchMatches && !filterMatches) return searchMatches;
    if (!searchMatches && filterMatches) return filterMatches;
    // AND: intersection
    const combined = new Set<string>();
    for (const code of searchMatches!) {
      if (filterMatches!.has(code)) combined.add(code);
    }
    return combined;
  }, [searchMatches, filterMatches]);

  useEffect(() => {
    saveCursadas(curso.codigoCurso, cursadas);
  }, [curso.codigoCurso, cursadas]);

  const disciplinasMap = useMemo(() => {
    const map = new Map<string, Disciplina>();
    for (const d of curso.disciplinas) {
      map.set(d.codigoDisciplina, d);
    }
    return map;
  }, [curso.disciplinas]);

  const validCodes = useMemo(
    () => new Set(curso.disciplinas.map((d) => d.codigoDisciplina)),
    [curso.disciplinas]
  );

  const dependentsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of curso.disciplinas) {
      for (const pre of d.prerequisitos) {
        const list = map.get(pre) || [];
        list.push(d.codigoDisciplina);
        map.set(pre, list);
      }
    }
    return map;
  }, [curso.disciplinas]);

  const prerequisitosMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of curso.disciplinas) {
      map.set(d.codigoDisciplina, d.prerequisitos);
    }
    return map;
  }, [curso.disciplinas]);

  const highlightedSet = useMemo(() => {
    if (!hoveredDisciplina) return new Set<string>();
    const set = new Set<string>();
    const queue = [...(prerequisitosMap.get(hoveredDisciplina) || [])];
    while (queue.length > 0) {
      const code = queue.pop()!;
      if (set.has(code)) continue;
      set.add(code);
      const prereqs = prerequisitosMap.get(code) || [];
      for (const p of prereqs) {
        queue.push(p);
      }
    }
    return set;
  }, [hoveredDisciplina, prerequisitosMap]);

  const handleDisciplinaClick = useCallback(
    (codigoDisciplina: string) => {
      const status = statusMap.get(codigoDisciplina);
      if (status === 'cursavel') {
        setCursadas((prev) => {
          const next = new Set(prev);
          next.add(codigoDisciplina);
          return next;
        });
      } else if (status === 'cursada') {
        setCursadas((prev) => {
          const next = new Set(prev);
          const toRemove = new Set<string>();
          const queue = [codigoDisciplina];
          while (queue.length > 0) {
            const code = queue.pop()!;
            if (toRemove.has(code)) continue;
            toRemove.add(code);
            const deps = dependentsMap.get(code) || [];
            for (const dep of deps) {
              if (next.has(dep)) {
                queue.push(dep);
              }
            }
          }
          for (const code of toRemove) {
            next.delete(code);
          }
          return next;
        });
      }
      // nao_cursavel: do nothing
    },
    [statusMap, dependentsMap]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, codigoDisciplina: string) => {
      e.preventDefault();
      setDrawerDisciplina(codigoDisciplina);
    },
    []
  );

  const handleInfoClick = useCallback(
    (e: React.MouseEvent, codigoDisciplina: string) => {
      e.stopPropagation();
      setDrawerDisciplina(codigoDisciplina);
    },
    []
  );

  const handleDrawerNavigate = useCallback((codigoDisciplina: string) => {
    setDrawerDisciplina(codigoDisciplina);
  }, []);

  const semestreMap = useMemo(() => {
    const map = new Map<number, Disciplina[]>();
    for (const d of curso.disciplinas) {
      const list = map.get(d.semestre) || [];
      list.push(d);
      map.set(d.semestre, list);
    }
    return map;
  }, [curso.disciplinas]);

  const semestres = useMemo(
    () => Array.from(semestreMap.keys()).sort((a, b) => a - b),
    [semestreMap]
  );

  const progressInfo = useMemo(() => {
    let completed = 0;
    for (const d of curso.disciplinas) {
      if (cursadas.has(d.codigoDisciplina)) {
        completed += d.cargaHoraria;
      }
    }
    const total = curso.cargaHorariaTotal;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percentage };
  }, [curso.disciplinas, curso.cargaHorariaTotal, cursadas]);

  const calculateLines = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const gridRect = grid.getBoundingClientRect();
    const newLines: Line[] = [];
    for (const d of curso.disciplinas) {
      if (d.prerequisitos.length === 0) continue;
      const toEl = grid.querySelector(`[data-disciplina="${d.codigoDisciplina}"]`) as HTMLElement | null;
      if (!toEl) continue;
      const toRect = toEl.getBoundingClientRect();
      for (const pre of d.prerequisitos) {
        const fromEl = grid.querySelector(`[data-disciplina="${pre}"]`) as HTMLElement | null;
        if (!fromEl) continue;
        const fromRect = fromEl.getBoundingClientRect();
        newLines.push({
          x1: fromRect.right - gridRect.left,
          y1: fromRect.top + fromRect.height / 2 - gridRect.top,
          x2: toRect.left - gridRect.left,
          y2: toRect.top + toRect.height / 2 - gridRect.top,
          from: pre,
          to: d.codigoDisciplina,
        });
      }
    }
    setLines(newLines);
  }, [curso.disciplinas]);

  useLayoutEffect(() => {
    calculateLines();
  }, [calculateLines, cursadas]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const ro = new ResizeObserver(() => calculateLines());
    ro.observe(grid);
    window.addEventListener('resize', calculateLines);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', calculateLines);
    };
  }, [calculateLines]);

  const isLineHighlighted = useCallback(
    (line: Line) => {
      if (!hoveredDisciplina) return false;
      return (
        (highlightedSet.has(line.from) || line.from === hoveredDisciplina) &&
        (highlightedSet.has(line.to) || line.to === hoveredDisciplina)
      );
    },
    [hoveredDisciplina, highlightedSet]
  );

  return (
    <div className="flowchart-view">
      <div className="flowchart-header">
        <button className="back-button" onClick={onBack}>
          ← Voltar
        </button>
      </div>
      <h1>{curso.nomeCurso}</h1>
      <p className="flowchart-subtitle">
        {curso.codigoCurso} · {curso.numeroSemestres} semestres · {curso.cargaHorariaTotal}h
      </p>

      <div className="status-legend">
        <div className="legend-item">
          <div className="legend-swatch" data-status="cursada" />
          <span>Cursada</span>
        </div>
        <div className="legend-item">
          <div className="legend-swatch" data-status="cursavel" />
          <span>Cursável</span>
        </div>
        <div className="legend-item">
          <div className="legend-swatch" data-status="nao_cursavel" />
          <span>Não cursável</span>
        </div>
      </div>

      <SearchBar onSearchChange={setSearchTerm} />

      <FilterChips
        activeNucleos={activeNucleos}
        activeStatuses={activeStatuses}
        onToggleNucleo={handleToggleNucleo}
        onToggleStatus={handleToggleStatus}
        onClearFilters={handleClearFilters}
        matchCount={combinedMatches ? combinedMatches.size : null}
        totalCount={curso.disciplinas.length}
      />

      <div
        className={`flowchart-grid${hoveredDisciplina ? ' is-hovering' : ''}${combinedMatches ? ' is-searching' : ''}`}
        ref={gridRef}
        style={{ position: 'relative' }}
      >
        <svg
          className="prerequisite-lines"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {lines.map((line) => {
            const highlighted = isLineHighlighted(line);
            return (
              <path
                key={`${line.from}-${line.to}`}
                d={`M ${line.x1} ${line.y1} C ${line.x1 + 30} ${line.y1}, ${line.x2 - 30} ${line.y2}, ${line.x2} ${line.y2}`}
                stroke={highlighted ? '#edc55a' : hoveredDisciplina ? 'rgba(240,236,228,0.05)' : 'rgba(240,236,228,0.18)'}
                strokeWidth={highlighted ? 2.5 : 1.5}
                fill="none"
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
              />
            );
          })}
        </svg>

        {semestres.map((sem) => (
          <div
            key={sem}
            className="semester-column"
            style={{ position: 'relative', zIndex: 1, animationDelay: `${(sem - 1) * 0.06}s` }}
          >
            <h3 className="semester-header">{sem}º Semestre</h3>
            <div className="semester-cards">
              {semestreMap.get(sem)!.map((d) => {
                const status = statusMap.get(d.codigoDisciplina) || 'nao_cursavel';
                const isHovered = d.codigoDisciplina === hoveredDisciplina;
                const isHighlighted = highlightedSet.has(d.codigoDisciplina);
                const isSearchMatch = combinedMatches ? combinedMatches.has(d.codigoDisciplina) : false;
                return (
                  <div
                    key={d.codigoDisciplina}
                    data-disciplina={d.codigoDisciplina}
                    data-status={status}
                    data-nucleo={d.nucleo}
                    className={`discipline-card${isHovered ? ' is-hovered' : ''}${isHighlighted ? ' is-highlighted' : ''}${isSearchMatch ? ' is-search-match' : ''}`}
                    title={statusLabels[status]}
                    onClick={() => handleDisciplinaClick(d.codigoDisciplina)}
                    onContextMenu={(e) => handleContextMenu(e, d.codigoDisciplina)}
                    onMouseEnter={() => setHoveredDisciplina(d.codigoDisciplina)}
                    onMouseLeave={() => setHoveredDisciplina(null)}
                  >
                    <button
                      className="discipline-info-btn"
                      onClick={(e) => handleInfoClick(e, d.codigoDisciplina)}
                      aria-label={`Detalhes de ${d.nomeDisciplina}`}
                    >
                      i
                    </button>
                    <span className="discipline-code">{d.codigoDisciplina}</span>
                    <span className="discipline-name">{d.nomeDisciplina}</span>
                    <span className="discipline-info">
                      {d.cargaHoraria}h · {nucleoLabels[d.nucleo] || d.nucleo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="progress-section">
        <div className="progress-header-row">
          <ExportButton curso={curso} cursadas={cursadas} />
          <ImportButton
            curso={curso}
            validCodes={validCodes}
            onImport={setCursadas}
          />
        </div>
        <div className="progress-label">
          <span className="progress-label-title">Progresso do Curso</span>
          <span className="progress-label-value">
            {progressInfo.completed}h / {progressInfo.total}h ·{' '}
            <span className="progress-label-percentage">{progressInfo.percentage.toFixed(1)}%</span>
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(progressInfo.percentage, 100)}%` }}
          />
        </div>

        <ProgressByNucleo curso={curso} cursadas={cursadas} />
      </div>

      {drawerDisciplina && disciplinasMap.get(drawerDisciplina) && (
        <DisciplinaDrawer
          disciplina={disciplinasMap.get(drawerDisciplina)!}
          status={statusMap.get(drawerDisciplina) || 'nao_cursavel'}
          prerequisitosDisciplinas={
            (disciplinasMap.get(drawerDisciplina)!.prerequisitos || [])
              .map((code) => disciplinasMap.get(code))
              .filter((d): d is Disciplina => d !== undefined)
          }
          dependentesDisciplinas={
            (dependentsMap.get(drawerDisciplina) || [])
              .map((code) => disciplinasMap.get(code))
              .filter((d): d is Disciplina => d !== undefined)
          }
          onClose={() => setDrawerDisciplina(null)}
          onNavigate={handleDrawerNavigate}
        />
      )}
    </div>
  );
}
