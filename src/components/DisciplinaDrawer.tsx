import { useCallback, useEffect } from 'react';
import type { Disciplina, Status } from '../types';

interface DisciplinaDrawerProps {
  disciplina: Disciplina;
  status: Status;
  prerequisitosDisciplinas: Disciplina[];
  dependentesDisciplinas: Disciplina[];
  onClose: () => void;
  onNavigate: (codigoDisciplina: string) => void;
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

export function DisciplinaDrawer({
  disciplina,
  status,
  prerequisitosDisciplinas,
  dependentesDisciplinas,
  onClose,
  onNavigate,
}: DisciplinaDrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-code">{disciplina.codigoDisciplina}</span>
            <h2 className="drawer-title">{disciplina.nomeDisciplina}</h2>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="drawer-badges">
          <span className={`drawer-badge drawer-badge-status`} data-status={status}>
            {statusLabels[status]}
          </span>
          <span className="drawer-badge drawer-badge-nucleo" data-nucleo={disciplina.nucleo}>
            {nucleoLabels[disciplina.nucleo] || disciplina.nucleo}
          </span>
        </div>

        <div className="drawer-details">
          <div className="drawer-detail-row">
            <span className="drawer-detail-label">Carga Horária</span>
            <span className="drawer-detail-value">{disciplina.cargaHoraria}h</span>
          </div>
          <div className="drawer-detail-row">
            <span className="drawer-detail-label">Semestre Recomendado</span>
            <span className="drawer-detail-value">{disciplina.semestre}º</span>
          </div>
        </div>

        {prerequisitosDisciplinas.length > 0 && (
          <div className="drawer-section">
            <h3 className="drawer-section-title">Pré-requisitos</h3>
            <ul className="drawer-discipline-list">
              {prerequisitosDisciplinas.map((d) => (
                <li key={d.codigoDisciplina}>
                  <button
                    className="drawer-discipline-link"
                    onClick={() => onNavigate(d.codigoDisciplina)}
                  >
                    <span className="drawer-link-code">{d.codigoDisciplina}</span>
                    <span className="drawer-link-name">{d.nomeDisciplina}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {dependentesDisciplinas.length > 0 && (
          <div className="drawer-section">
            <h3 className="drawer-section-title">Desbloqueia</h3>
            <ul className="drawer-discipline-list">
              {dependentesDisciplinas.map((d) => (
                <li key={d.codigoDisciplina}>
                  <button
                    className="drawer-discipline-link"
                    onClick={() => onNavigate(d.codigoDisciplina)}
                  >
                    <span className="drawer-link-code">{d.codigoDisciplina}</span>
                    <span className="drawer-link-name">{d.nomeDisciplina}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="drawer-section">
          <h3 className="drawer-section-title">Ementa</h3>
          <p className="drawer-ementa">
            {disciplina.ementa || 'Ementa não disponível'}
          </p>
        </div>
      </aside>
    </div>
  );
}
