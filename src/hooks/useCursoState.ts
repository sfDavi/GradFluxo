import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Curso, Disciplina } from '../types';
import { calcularStatus } from '../utils/calcularStatus';

// ─── localStorage helpers ───

function getStorageKey(codigoCurso: string): string {
  return `gradfluxo-cursadas-${codigoCurso}`;
}

function getPlanKey(codigoCurso: string): string {
  return `gradfluxo-plano-${codigoCurso}`;
}

interface PlanoData {
  codigoCurso: string;
  movimentos: Record<string, number>;
}

function loadPlano(codigoCurso: string): Record<string, number> {
  try {
    const stored = localStorage.getItem(getPlanKey(codigoCurso));
    if (stored) {
      const data: PlanoData = JSON.parse(stored);
      if (data && data.codigoCurso === codigoCurso && data.movimentos) {
        return data.movimentos;
      }
    }
  } catch {
    // ignore corrupted data
  }
  return {};
}

function savePlano(codigoCurso: string, movimentos: Record<string, number>): void {
  if (Object.keys(movimentos).length === 0) {
    localStorage.removeItem(getPlanKey(codigoCurso));
  } else {
    const data: PlanoData = { codigoCurso, movimentos };
    localStorage.setItem(getPlanKey(codigoCurso), JSON.stringify(data));
  }
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
  if (cursadas.size === 0) {
    localStorage.removeItem(getStorageKey(codigoCurso));
  } else {
    localStorage.setItem(getStorageKey(codigoCurso), JSON.stringify([...cursadas]));
  }
}

// ─── Hook ───

export function useCursoState(curso: Curso) {
  const [cursadas, setCursadas] = useState<Set<string>>(() => loadCursadas(curso.codigoCurso));
  const [plano, setPlano] = useState<Record<string, number>>(() => loadPlano(curso.codigoCurso));
  const [undoInfo, setUndoInfo] = useState<{
    snapshot: Set<string>;
    nomeDisciplina: string;
    cascadeCount: number;
  } | null>(null);

  // ─── Persistence ───

  useEffect(() => {
    saveCursadas(curso.codigoCurso, cursadas);
  }, [curso.codigoCurso, cursadas]);

  useEffect(() => {
    savePlano(curso.codigoCurso, plano);
  }, [curso.codigoCurso, plano]);

  // ─── Derived data ───

  const statusMap = useMemo(
    () => calcularStatus(curso.disciplinas, cursadas),
    [curso.disciplinas, cursadas]
  );

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

  const semestreMap = useMemo(() => {
    const map = new Map<number, Disciplina[]>();
    for (const d of curso.disciplinas) {
      const sem = plano[d.codigoDisciplina] ?? d.semestre;
      const list = map.get(sem) || [];
      list.push(d);
      map.set(sem, list);
    }
    return map;
  }, [curso.disciplinas, plano]);

  const semestres = useMemo(
    () => Array.from(semestreMap.keys()).sort((a, b) => a - b),
    [semestreMap]
  );

  const hasPlano = Object.keys(plano).length > 0;

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

  // ─── Handlers ───

  const handleDisciplinaClick = useCallback(
    (codigoDisciplina: string) => {
      const status = statusMap.get(codigoDisciplina);
      if (status === 'cursavel') {
        setUndoInfo(null);
        setCursadas((prev) => {
          const next = new Set(prev);
          next.add(codigoDisciplina);
          return next;
        });
      } else if (status === 'cursada') {
        setCursadas((prev) => {
          const snapshot = new Set(prev);
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
          const cascadeCount = toRemove.size - 1;
          if (cascadeCount > 0) {
            const disc = disciplinasMap.get(codigoDisciplina);
            setUndoInfo({
              snapshot,
              nomeDisciplina: disc?.nomeDisciplina || codigoDisciplina,
              cascadeCount,
            });
          } else {
            setUndoInfo(null);
          }
          return next;
        });
      }
    },
    [statusMap, dependentsMap, disciplinasMap]
  );

  const handleUndo = useCallback(() => {
    if (undoInfo) {
      setCursadas(undoInfo.snapshot);
      setUndoInfo(null);
    }
  }, [undoInfo]);

  const handleUndoDismiss = useCallback(() => {
    setUndoInfo(null);
  }, []);

  const handleResetPlano = useCallback(() => {
    setPlano({});
    setCursadas(new Set());
    setUndoInfo(null);
  }, []);

  const handleMarkSemestre = useCallback(
    (sem: number) => {
      const disciplinas = semestreMap.get(sem);
      if (!disciplinas) return;
      setCursadas((prev) => {
        const next = new Set(prev);
        for (const d of disciplinas) {
          next.add(d.codigoDisciplina);
        }
        return next;
      });
    },
    [semestreMap]
  );

  return {
    cursadas,
    setCursadas,
    plano,
    setPlano,
    statusMap,
    disciplinasMap,
    dependentsMap,
    validCodes,
    progressInfo,
    semestreMap,
    semestres,
    hasPlano,
    undoInfo,
    handleDisciplinaClick,
    handleUndo,
    handleUndoDismiss,
    handleResetPlano,
    handleMarkSemestre,
  };
}
