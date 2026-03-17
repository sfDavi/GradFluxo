import { useCallback, useState } from 'react';
import type { Disciplina } from '../types';

export function useDragDrop(
  disciplinasMap: Map<string, Disciplina>,
  setPlano: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  isMobile: boolean
) {
  const [dragOverSemestre, setDragOverSemestre] = useState<number | null>(null);

  const isDraggable = useCallback(
    (d: Disciplina) => !isMobile && (d.nucleo === 'livre' || d.nucleo === 'optativo'),
    [isMobile]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, codigoDisciplina: string) => {
      e.dataTransfer.setData('text/plain', codigoDisciplina);
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, semestre: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverSemestre(semestre);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverSemestre(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetSemestre: number) => {
      e.preventDefault();
      setDragOverSemestre(null);
      const code = e.dataTransfer.getData('text/plain');
      if (!code) return;
      const disc = disciplinasMap.get(code);
      if (!disc) return;
      if (disc.nucleo !== 'livre' && disc.nucleo !== 'optativo') return;
      if (targetSemestre === disc.semestre) {
        setPlano((prev) => {
          const next = { ...prev };
          delete next[code];
          return next;
        });
      } else {
        setPlano((prev) => ({ ...prev, [code]: targetSemestre }));
      }
    },
    [disciplinasMap, setPlano]
  );

  const handleDragEnd = useCallback(() => {
    setDragOverSemestre(null);
  }, []);

  return {
    dragOverSemestre,
    isDraggable,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
