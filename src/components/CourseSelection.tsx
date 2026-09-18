import { useMemo, useState } from 'react';
import type { Curso } from '../types';
import { normalizeText } from '../utils/normalizeText';
import { agruparPorCurso, formatarHoras } from '../utils/catalogo';
import type { Grade, GrupoCurso } from '../utils/catalogo';
import { ThemeToggle } from './ThemeToggle';

interface CourseSelectionProps {
  cursos: Curso[];
  onSelectCurso: (curso: Curso) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

/** Cada curso recebe um acento fixo da paleta de núcleos, na ordem do catálogo. */
const ACENTOS = ['comum', 'especifico', 'livre', 'optativo'] as const;

function Chevron() {
  return (
    <svg
      className="grade-chevron"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function metaGrade(curso: Curso) {
  return `${curso.numeroSemestres} semestres · ${formatarHoras(curso.cargaHorariaTotal)} · ${curso.disciplinas.length} disciplinas`;
}

export function CourseSelection({
  cursos,
  onSelectCurso,
  theme,
  onToggleTheme,
}: CourseSelectionProps) {
  const [query, setQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const grupos = useMemo(() => agruparPorCurso(cursos), [cursos]);

  const filtrados = useMemo<GrupoCurso[]>(() => {
    const q = normalizeText(query.trim());
    if (!q) return grupos;
    return grupos
      .map((grupo) => ({
        ...grupo,
        grades: normalizeText(grupo.nomeCurso).includes(q)
          ? grupo.grades
          : grupo.grades.filter((g) => normalizeText(g.curso.codigoCurso).includes(q)),
      }))
      .filter((grupo) => grupo.grades.length > 0);
  }, [grupos, query]);

  const totalGrades = filtrados.reduce((n, g) => n + g.grades.length, 0);

  const renderGradeRow = (grade: Grade) => (
    <button
      key={grade.curso.codigoCurso}
      type="button"
      className="grade-row"
      onClick={() => onSelectCurso(grade.curso)}
    >
      {grade.ano && <span className="grade-year">{grade.ano}</span>}
      <span className="grade-info">
        <span className="grade-code">{grade.codigoBase}</span>
        <span className="grade-meta">{metaGrade(grade.curso)}</span>
      </span>
      {grade.percentual !== null ? (
        <span className="grade-pct">
          {grade.percentual}% feito
          <Chevron />
        </span>
      ) : (
        <Chevron />
      )}
    </button>
  );

  return (
    <div className="landing">
      <header className="landing-bar">
        <span className="landing-brand">
          Grad<span>Fluxo</span>
        </span>
        <button
          type="button"
          className={`landing-nav-btn${showHelp ? ' is-active' : ''}`}
          aria-expanded={showHelp}
          onClick={() => setShowHelp((v) => !v)}
        >
          Como funciona
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {showHelp ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
          </svg>
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} inline />
      </header>

      {showHelp && (
        <section className="landing-help" aria-label="Como funciona">
          <div className="landing-help-head">
            <h2 className="landing-help-title">Como funciona</h2>
            <button
              type="button"
              className="landing-help-close"
              onClick={() => setShowHelp(false)}
              aria-label="Fechar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          </div>

          <div className="landing-help-grid">
            <div className="landing-help-col">
              <h3 className="landing-help-heading">Em três passos</h3>
              <ol className="landing-steps">
                <li>
                  <span className="landing-step-n">1</span>
                  Escolha a grade do seu curso, confira o ano e o código no seu histórico.
                </li>
                <li>
                  <span className="landing-step-n">2</span>
                  Marque o que já cursou. Clique numa disciplina disponível e ela passa a contar.
                </li>
                <li>
                  <span className="landing-step-n">3</span>
                  Veja o que isso destrava adiante e quanto falta de carga horária para formar.
                </li>
              </ol>
            </div>

            <div className="landing-help-col">
              <h3 className="landing-help-heading">Onde seu progresso fica</h3>
              <div className="landing-warn">
                <p className="landing-warn-title">Só neste navegador. Não há conta nem sincronização.</p>
                <ul className="landing-warn-list">
                  <li>Cada grade guarda um progresso separado.</li>
                  <li>Outro computador ou celular começa do zero.</li>
                  <li>Aba anônima e limpar dados do site apagam tudo.</li>
                </ul>
              </div>
            </div>

            <div className="landing-help-col">
              <h3 className="landing-help-heading">Dentro do curso</h3>
              <div className="landing-hint">
                <span className="landing-hint-key" aria-hidden="true">?</span>
                <span>
                  Os atalhos de clique e a legenda de cores do fluxograma ficam neste botão, no
                  topo da página do curso.
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="landing-main">
        <div className="landing-hero">
          <div className="landing-hero-text">
            <h1>Escolha sua grade</h1>
            <p>
              Alguns cursos têm mais de uma grade em vigor. Confira o ano e o código no seu
              histórico antes de abrir.
            </p>
          </div>

          <div className="search-bar landing-search">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="search"
              placeholder="Buscar por nome, código ou ano"
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
        </div>

        <section className="catalog">
          <div className="catalog-head">
            <h2 className="catalog-title">Todos os cursos</h2>
            <span className="catalog-rule" />
            <span className="catalog-count">
              {filtrados.length} {filtrados.length === 1 ? 'curso' : 'cursos'} · {totalGrades}{' '}
              {totalGrades === 1 ? 'grade' : 'grades'}
            </span>
          </div>

          {filtrados.length === 0 ? (
            <p className="catalog-empty">Nenhum curso encontrado para “{query}”</p>
          ) : (
            <div className="catalog-grid">
              {filtrados.map((grupo, i) => {
                const acento = ACENTOS[i % ACENTOS.length];

                if (grupo.grades.length === 1) {
                  const grade = grupo.grades[0];
                  return (
                    <button
                      key={grupo.nomeCurso}
                      type="button"
                      className="course-single"
                      data-acento={acento}
                      onClick={() => onSelectCurso(grade.curso)}
                    >
                      <span className="course-single-info">
                        <span className="course-group-name">{grupo.nomeCurso}</span>
                        <span className="course-single-meta">
                          <span className="grade-code">{grade.codigoBase}</span>
                          <span className="grade-meta">{metaGrade(grade.curso)}</span>
                        </span>
                      </span>
                      {grade.percentual !== null && (
                        <span className="grade-pct">{grade.percentual}% feito</span>
                      )}
                      <Chevron />
                    </button>
                  );
                }

                return (
                  <div key={grupo.nomeCurso} className="course-group" data-acento={acento}>
                    <div className="course-group-head">
                      <h3 className="course-group-name">{grupo.nomeCurso}</h3>
                      <span className="course-group-count">{grupo.grades.length} grades</span>
                    </div>
                    <div className="grade-list">{grupo.grades.map(renderGradeRow)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
