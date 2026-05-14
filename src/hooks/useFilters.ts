import { useCallback, useMemo, useState } from 'react';
import type { Curso, Nucleo, Status } from '../types';
import { normalizeText } from '../utils/normalizeText';

export function useFilters(curso: Curso, statusMap: Map<string, Status>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeNucleos, setActiveNucleos] = useState<Set<Nucleo>>(new Set());
  const [activeStatuses, setActiveStatuses] = useState<Set<Status>>(new Set());

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
    const combined = new Set<string>();
    for (const code of searchMatches!) {
      if (filterMatches!.has(code)) combined.add(code);
    }
    return combined;
  }, [searchMatches, filterMatches]);

  return {
    setSearchTerm,
    activeNucleos,
    activeStatuses,
    combinedMatches,
    hasFilters,
    handleToggleNucleo,
    handleToggleStatus,
    handleClearFilters,
  };
}
