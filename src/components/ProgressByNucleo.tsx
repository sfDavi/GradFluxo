import { useMemo } from 'react';
import type { Curso, Nucleo } from '../types';

interface ProgressByNucleoProps {
  curso: Curso;
  cursadas: Set<string>;
}

const nucleoConfig: { nucleo: Nucleo; label: string; cssVar: string; field: keyof Curso }[] = [
  { nucleo: 'comum', label: 'Comum', cssVar: 'var(--nucleo-comum)', field: 'cargaHorariaNucleoComum' },
  { nucleo: 'especifico', label: 'Específico', cssVar: 'var(--nucleo-especifico)', field: 'cargaHorariaNucleoEspecifico' },
  { nucleo: 'livre', label: 'Livre', cssVar: 'var(--nucleo-livre)', field: 'cargaHorariaNucleoLivre' },
  { nucleo: 'optativo', label: 'Optativo', cssVar: 'var(--nucleo-optativo)', field: 'cargaHorariaNucleoOptativo' },
];

export function ProgressByNucleo({ curso, cursadas }: ProgressByNucleoProps) {
  const nucleoProgress = useMemo(() => {
    const hours: Record<Nucleo, number> = { comum: 0, especifico: 0, livre: 0, optativo: 0 };
    for (const d of curso.disciplinas) {
      if (cursadas.has(d.codigoDisciplina)) {
        hours[d.nucleo] += d.cargaHoraria;
      }
    }
    return nucleoConfig.map(({ nucleo, label, cssVar, field }) => {
      const total = curso[field] as number;
      const completed = hours[nucleo];
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      return { nucleo, label, cssVar, completed, total, percentage };
    });
  }, [curso, cursadas]);

  return (
    <div className="progress-by-nucleo">
      {nucleoProgress.map((item) => (
        <div key={item.nucleo} className="nucleo-progress-row">
          <div className="nucleo-progress-label">
            <span className="nucleo-progress-dot" style={{ background: item.cssVar }} />
            <span className="nucleo-progress-name">{item.label}</span>
            <span className="nucleo-progress-value">
              {item.completed}h / {item.total}h ({item.percentage.toFixed(0)}%)
            </span>
          </div>
          <div className="nucleo-progress-track">
            <div
              className="nucleo-progress-fill"
              style={{
                width: `${Math.min(item.percentage, 100)}%`,
                background: item.cssVar,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
