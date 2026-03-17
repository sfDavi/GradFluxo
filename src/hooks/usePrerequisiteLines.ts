import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { Curso } from '../types';

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  from: string;
  to: string;
}

export function usePrerequisiteLines(
  gridRef: React.RefObject<HTMLDivElement | null>,
  curso: Curso,
  cursadas: Set<string>,
  plano: Record<string, number>
) {
  const [lines, setLines] = useState<Line[]>([]);
  const [hoveredDisciplina, setHoveredDisciplina] = useState<string | null>(null);

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
  }, [curso.disciplinas, gridRef]);

  useLayoutEffect(() => {
    calculateLines();
  }, [calculateLines, cursadas, plano]);

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
  }, [calculateLines, gridRef]);

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

  return {
    lines,
    hoveredDisciplina,
    setHoveredDisciplina,
    highlightedSet,
    isLineHighlighted,
  };
}
