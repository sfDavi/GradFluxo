import type { Curso } from "../types";

interface CourseSelectionProps {
  cursos: Curso[];
  onSelectCurso: (curso: Curso) => void;
}

export function CourseSelection({
  cursos,
  onSelectCurso,
}: CourseSelectionProps) {
  return (
    <div className="course-selection">
      <h1>
        <span>Grad</span>Fluxo
      </h1>
      <p>Selecione seu curso para visualizar o fluxograma de disciplinas</p>
      <div className="course-list">
        {cursos.map((curso) => (
          <button
            key={curso.codigoCurso}
            className="course-card"
            onClick={() => onSelectCurso(curso)}
          >
            <strong>{curso.nomeCurso}</strong>
            <span>{curso.codigoCurso}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
