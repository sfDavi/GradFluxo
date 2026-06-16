import { useState } from 'react';
import type { Curso } from "../types";
import { normalizeText } from '../utils/normalizeText';

interface CourseSelectionProps {
  cursos: Curso[];
  onSelectCurso: (curso: Curso) => void;
}

export function CourseSelection({
  cursos,
  onSelectCurso,
}: CourseSelectionProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? cursos.filter(
        (c) =>
          normalizeText(c.nomeCurso).includes(normalizeText(query)) ||
          normalizeText(c.codigoCurso).includes(normalizeText(query))
      )
    : cursos;

  return (
    <div className="course-selection">
      <h1>
        <span>Grad</span>Fluxo
      </h1>
      <p>Selecione seu curso para visualizar o fluxograma de disciplinas</p>

      <div className="search-bar course-selection-search">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="search-input"
          type="search"
          placeholder="Buscar curso..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')} aria-label="Limpar busca">
            ✕
          </button>
        )}
      </div>

      <div className="course-list">
        {filtered.length === 0 ? (
          <p className="course-search-empty">Nenhum curso encontrado para "{query}"</p>
        ) : (
          filtered.map((curso) => (
            <button
              key={curso.codigoCurso}
              className="course-card"
              onClick={() => onSelectCurso(curso)}
            >
              <strong>{curso.nomeCurso}</strong>
              <span>{curso.codigoCurso}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
