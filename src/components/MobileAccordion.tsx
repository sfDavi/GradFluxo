import { useState } from 'react';
import type { Disciplina, Status } from '../types';

const nucleoLabels: Record<string, string> = {
  comum: 'Núcleo Comum',
  livre: 'Núcleo Livre',
  especifico: 'Núcleo Específico',
  optativo: 'Optativo',
};

interface MobileAccordionProps {
  semestres: number[];
  semestreMap: Map<number, Disciplina[]>;
  statusMap: Map<string, Status>;
  cursadas: Set<string>;
  simuladas: Set<string>;
  simulationMode: boolean;
  combinedMatches: Set<string> | null;
  onDisciplinaClick: (codigo: string) => void;
  onInfoClick: (e: React.MouseEvent, codigo: string) => void;
  onContextMenu: (e: React.MouseEvent, codigo: string) => void;
}

const statusLabels: Record<Status, string> = {
  cursada: 'Cursada',
  cursavel: 'Cursável',
  nao_cursavel: 'Não cursável',
};

export function MobileAccordion({
  semestres,
  semestreMap,
  statusMap,
  cursadas,
  simuladas,
  simulationMode,
  combinedMatches,
  onDisciplinaClick,
  onInfoClick,
  onContextMenu,
}: MobileAccordionProps) {
  const [expandedSemestres, setExpandedSemestres] = useState<Set<number>>(new Set([1]));

  const toggleSemestre = (sem: number) => {
    setExpandedSemestres((prev) => {
      const next = new Set(prev);
      if (next.has(sem)) next.delete(sem);
      else next.add(sem);
      return next;
    });
  };

  return (
    <div className={`mobile-accordion${combinedMatches ? ' is-searching' : ''}`}>
      {semestres.map((sem) => {
        const disciplinas = semestreMap.get(sem) || [];
        const isExpanded = expandedSemestres.has(sem);
        return (
          <div key={sem} className={`accordion-item${isExpanded ? ' is-expanded' : ''}`}>
            <button
              className="accordion-header"
              onClick={() => toggleSemestre(sem)}
              aria-expanded={isExpanded}
            >
              <span className="accordion-title">{sem}º Semestre</span>
              <span className="accordion-meta">
                <span className="accordion-count">{disciplinas.length} disciplinas</span>
                <span className={`accordion-chevron${isExpanded ? ' is-open' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </button>
            {isExpanded && (
              <div className="accordion-content">
                {disciplinas.map((d) => {
                  const status = statusMap.get(d.codigoDisciplina) || 'nao_cursavel';
                  const isSearchMatch = combinedMatches ? combinedMatches.has(d.codigoDisciplina) : false;
                  const isSimulated = simuladas.has(d.codigoDisciplina);
                  const isUnlockedBySimulation = simulationMode && !cursadas.has(d.codigoDisciplina) && !simuladas.has(d.codigoDisciplina) && status === 'cursavel';
                  return (
                    <div
                      key={d.codigoDisciplina}
                      data-disciplina={d.codigoDisciplina}
                      data-status={status}
                      data-nucleo={d.nucleo}
                      className={`discipline-card${isSearchMatch ? ' is-search-match' : ''}${isSimulated ? ' is-simulated' : ''}${isUnlockedBySimulation ? ' is-unlocked-by-sim' : ''}`}
                      title={isSimulated ? 'Simulado' : statusLabels[status]}
                      onClick={() => onDisciplinaClick(d.codigoDisciplina)}
                      onContextMenu={(e) => onContextMenu(e, d.codigoDisciplina)}
                    >
                      <button
                        className="discipline-info-btn"
                        onClick={(e) => onInfoClick(e, d.codigoDisciplina)}
                        aria-label={`Detalhes de ${d.nomeDisciplina}`}
                      >
                        i
                      </button>
                      {isSimulated && <span className="simulated-badge">Simulado</span>}
                      <span className="discipline-code">{d.codigoDisciplina}</span>
                      <span className="discipline-name">{d.nomeDisciplina}</span>
                      <span className="discipline-info">
                        {d.cargaHoraria}h · {nucleoLabels[d.nucleo] || d.nucleo}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
