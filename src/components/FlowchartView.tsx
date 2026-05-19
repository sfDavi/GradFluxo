import { useCallback, useRef, useState } from 'react';
import type { Curso, Disciplina, Status } from '../types';
import { useCursoState } from '../hooks/useCursoState';
import { useDragDrop } from '../hooks/useDragDrop';
import { useFilters } from '../hooks/useFilters';
import { useMobileDetect } from '../hooks/useMobileDetect';
import { usePrerequisiteLines } from '../hooks/usePrerequisiteLines';
import { DisciplinaDrawer } from './DisciplinaDrawer';
import { ExportButton } from './ExportButton';
import { ImportButton } from './ImportButton';
import { FilterChips } from './FilterChips';
import { MobileAccordion } from './MobileAccordion';
import { ProgressByNucleo } from './ProgressByNucleo';
import { SearchBar } from './SearchBar';
import { UndoToast } from './UndoToast';

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
  const isMobile = useMobileDetect();

  const {
    cursadas, setCursadas, plano, setPlano,
    statusMap, disciplinasMap, dependentsMap, validCodes,
    progressInfo, semestreMap, semestres, hasPlano, undoInfo,
    handleDisciplinaClick, handleUndo, handleUndoDismiss,
    handleResetPlano, handleMarkSemestre,
  } = useCursoState(curso);

  const {
    dragOverSemestre, isDraggable,
    handleDragStart, handleDragOver, handleDragLeave,
    handleDrop, handleDragEnd,
  } = useDragDrop(disciplinasMap, setPlano, isMobile);

  const {
    lines, hoveredDisciplina, setHoveredDisciplina,
    highlightedSet, isLineHighlighted,
  } = usePrerequisiteLines(gridRef, curso, cursadas, plano);

  const {
    setSearchTerm, activeNucleos, activeStatuses,
    combinedMatches, handleToggleNucleo, handleToggleStatus,
    handleClearFilters,
  } = useFilters(curso, statusMap);

  // ─── Drawer (local UI state) ───

  const [drawerDisciplina, setDrawerDisciplina] = useState<string | null>(null);

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

  // ─── Render ───

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

      {!isMobile && (
        <div style={{ marginBottom: '0.75rem' }}>
          <button
            className="reset-plano-btn"
            onClick={handleResetPlano}
            disabled={!hasPlano && cursadas.size === 0}
          >
            ↩ Restaurar
          </button>
        </div>
      )}

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

      {isMobile ? (
        <MobileAccordion
          semestres={semestres}
          semestreMap={semestreMap}
          statusMap={statusMap}
          combinedMatches={combinedMatches}
          onDisciplinaClick={handleDisciplinaClick}
          onInfoClick={handleInfoClick}
          onContextMenu={handleContextMenu}
        />
      ) : (
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
              const handle = Math.max(10, (line.x2 - line.x1) * 0.25);
              return (
                <path
                  key={`${line.from}-${line.to}`}
                  d={`M ${line.x1} ${line.y1} C ${line.x1 + handle} ${line.y1}, ${line.x2 - handle} ${line.y2}, ${line.x2} ${line.y2}`}
                  className={`prerequisite-line${highlighted ? ' is-highlighted' : hoveredDisciplina ? ' is-dimmed' : ''}`}
                />
              );
            })}
          </svg>

          {semestres.map((sem) => {
            const discs = semestreMap.get(sem)!;
            const allCursadas = discs.every((d) => cursadas.has(d.codigoDisciplina));
            const hasCursavel = discs.some((d) => statusMap.get(d.codigoDisciplina) === 'cursavel');
            return (
              <div
                key={sem}
                className={`semester-column${dragOverSemestre === sem ? ' is-drop-target' : ''}`}
                style={{ position: 'relative', zIndex: 1, animationDelay: `${(sem - 1) * 0.06}s` }}
                onDragOver={(e) => handleDragOver(e, sem)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, sem)}
              >
                <div className="semester-header">
                  <span>{sem}º Semestre</span>
                  <button
                    className={`mark-semester-btn${allCursadas ? ' is-done' : ''}`}
                    onClick={() => handleMarkSemestre(sem)}
                    disabled={!allCursadas && !hasCursavel}
                    title={
                      allCursadas
                        ? 'Desmarcar todas'
                        : hasCursavel
                          ? 'Marcar cursáveis como cursadas'
                          : 'Nenhuma disciplina cursável'
                    }
                  >
                    {allCursadas ? '✕' : '✔'}
                  </button>
                </div>
                <div className="semester-cards">
                  {discs.map((d) => {
                    const status = statusMap.get(d.codigoDisciplina) || 'nao_cursavel';
                    const isHovered = d.codigoDisciplina === hoveredDisciplina;
                    const isHighlighted = highlightedSet.has(d.codigoDisciplina);
                    const isSearchMatch = combinedMatches ? combinedMatches.has(d.codigoDisciplina) : false;
                    const canDrag = isDraggable(d);
                    const isMoved = plano[d.codigoDisciplina] !== undefined;
                    return (
                      <div
                        key={d.codigoDisciplina}
                        data-disciplina={d.codigoDisciplina}
                        data-status={status}
                        data-nucleo={d.nucleo}
                        className={`discipline-card${isHovered ? ' is-hovered' : ''}${isHighlighted ? ' is-highlighted' : ''}${isSearchMatch ? ' is-search-match' : ''}${canDrag ? ' is-draggable' : ''}${isMoved ? ' is-moved' : ''}`}
                        title={statusLabels[status]}
                        draggable={canDrag}
                        onDragStart={canDrag ? (e) => handleDragStart(e, d.codigoDisciplina) : undefined}
                        onDragEnd={canDrag ? handleDragEnd : undefined}
                        onClick={() => handleDisciplinaClick(d.codigoDisciplina)}
                        onContextMenu={(e) => handleContextMenu(e, d.codigoDisciplina)}
                        onMouseEnter={() => setHoveredDisciplina(d.codigoDisciplina)}
                        onMouseLeave={() => setHoveredDisciplina(null)}
                      >
                        {canDrag && <span className="drag-handle" aria-hidden="true">⠿</span>}
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
            );
          })}
        </div>
      )}

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

      {undoInfo && (
        <UndoToast
          nomeDisciplina={undoInfo.nomeDisciplina}
          cascadeCount={undoInfo.cascadeCount}
          onUndo={handleUndo}
          onDismiss={handleUndoDismiss}
        />
      )}

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
