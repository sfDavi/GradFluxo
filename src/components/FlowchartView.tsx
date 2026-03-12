import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Curso, Disciplina, Status } from '../types';
import { calcularStatus } from '../utils/calcularStatus';

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

const statusColors: Record<Status, string> = {
  cursada: '#2e7d32',
  cursavel: '#1565c0',
  nao_cursavel: '#616161',
};

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

  useEffect(() => {
    saveCursadas(curso.codigoCurso, cursadas);
  }, [curso.codigoCurso, cursadas]);
  const statusMap = useMemo(
    () => calcularStatus(curso.disciplinas, cursadas),
    [curso.disciplinas, cursadas]
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
          // Recursively collect all cursada dependents to remove
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

  return (
    <div className="flowchart-view">
      <button className="back-button" onClick={onBack}>← Voltar aos Cursos</button>
      <h1>{curso.nomeCurso}</h1>
      <p className="flowchart-subtitle">
        {curso.codigoCurso} — {curso.numeroSemestres} semestres
      </p>
      <div className="flowchart-grid" ref={gridRef} style={{ position: 'relative' }}>
        <svg className="prerequisite-lines" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.3)" />
            </marker>
            <marker id="arrowhead-highlight" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,0,0.9)" />
            </marker>
          </defs>
          {lines.map((line) => {
            const isHighlighted = hoveredDisciplina && (
              (highlightedSet.has(line.from) || line.from === hoveredDisciplina) &&
              (highlightedSet.has(line.to) || line.to === hoveredDisciplina)
            );
            return (
              <path
                key={`${line.from}-${line.to}`}
                d={`M ${line.x1} ${line.y1} C ${line.x1 + 30} ${line.y1}, ${line.x2 - 30} ${line.y2}, ${line.x2} ${line.y2}`}
                stroke={isHighlighted ? 'rgba(255,255,0,0.9)' : hoveredDisciplina ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                fill="none"
                markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                data-from={line.from}
                data-to={line.to}
                style={{ transition: 'stroke 0.15s, stroke-width 0.15s' }}
              />
            );
          })}
        </svg>
        {semestres.map((sem) => (
          <div key={sem} className="semester-column" style={{ position: 'relative', zIndex: 1 }}>
            <h3 className="semester-header">{sem}º Semestre</h3>
            <div className="semester-cards">
              {semestreMap.get(sem)!.map((d) => {
                const status = statusMap.get(d.codigoDisciplina) || 'nao_cursavel';
                return (
                  <div
                    key={d.codigoDisciplina}
                    data-disciplina={d.codigoDisciplina}
                    className="discipline-card"
                    style={{
                      backgroundColor: statusColors[status],
                      cursor: status === 'nao_cursavel' ? 'default' : 'pointer',
                      opacity: hoveredDisciplina
                        ? (d.codigoDisciplina === hoveredDisciplina || highlightedSet.has(d.codigoDisciplina) ? 1 : 0.3)
                        : undefined,
                      transition: 'opacity 0.15s',
                      boxShadow: hoveredDisciplina && highlightedSet.has(d.codigoDisciplina)
                        ? '0 0 0 2px #fff'
                        : undefined,
                    }}
                    title={statusLabels[status]}
                    onClick={() => handleDisciplinaClick(d.codigoDisciplina)}
                    onMouseEnter={() => setHoveredDisciplina(d.codigoDisciplina)}
                    onMouseLeave={() => setHoveredDisciplina(null)}
                  >
                    <span className="discipline-code">{d.codigoDisciplina}</span>
                    <span className="discipline-name">{d.nomeDisciplina}</span>
                    <span className="discipline-info">
                      {d.cargaHoraria}h — {nucleoLabels[d.nucleo] || d.nucleo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="progress-section">
        <div className="progress-label">
          Progresso: {progressInfo.completed}h / {progressInfo.total}h ({progressInfo.percentage.toFixed(1)}%)
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(progressInfo.percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
