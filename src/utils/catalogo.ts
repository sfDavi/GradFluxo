import type { Curso } from '../types';

/** Uma grade: o curso em si, mais o que a tela de seleção precisa para diferenciá-la. */
export interface Grade {
  curso: Curso;
  /** Código sem o ano: "CICOMP-BI-4" */
  codigoBase: string;
  /** Ano de criação da grade, quando o código traz. */
  ano: string | null;
  /** Percentual da carga horária já cursada, 0–100. null quando não há progresso salvo. */
  percentual: number | null;
}

/** Um curso e todas as suas grades. */
export interface GrupoCurso {
  nomeCurso: string;
  grades: Grade[];
}

const ANO_NO_FIM = /\s+(\d{4})$/;

export function parseCodigoCurso(codigoCurso: string): {
  codigoBase: string;
  ano: string | null;
} {
  const match = codigoCurso.match(ANO_NO_FIM);
  if (!match) return { codigoBase: codigoCurso.trim(), ano: null };
  return { codigoBase: codigoCurso.replace(ANO_NO_FIM, '').trim(), ano: match[1] };
}

/**
 * Percentual de carga horária cursada, lido do mesmo localStorage que o
 * fluxograma grava. Retorna null quando não há nada salvo para esta grade.
 */
export function getPercentualSalvo(curso: Curso): number | null {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(`gradfluxo-cursadas-${curso.codigoCurso}`);
  } catch {
    return null; // localStorage bloqueado (aba anônima, cookies desativados)
  }
  if (!stored) return null;

  let codigos: unknown;
  try {
    codigos = JSON.parse(stored);
  } catch {
    return null;
  }
  if (!Array.isArray(codigos) || codigos.length === 0) return null;

  const cursadas = new Set(codigos as string[]);
  const horas = curso.disciplinas.reduce(
    (total, d) => (cursadas.has(d.codigoDisciplina) ? total + d.cargaHoraria : total),
    0
  );
  if (horas === 0 || curso.cargaHorariaTotal === 0) return null;

  return Math.round((horas / curso.cargaHorariaTotal) * 100);
}

/**
 * Agrupa as grades por nome de curso. Quatro dos seis cursos do catálogo
 * repetem o nome e só se distinguem pelo ano, então o agrupamento é o que
 * transforma a lista numa escolha explícita em vez de um par ambíguo.
 * Dentro do grupo, a grade mais recente vem primeiro.
 */
export function agruparPorCurso(cursos: Curso[]): GrupoCurso[] {
  const grupos = new Map<string, GrupoCurso>();

  for (const curso of cursos) {
    const { codigoBase, ano } = parseCodigoCurso(curso.codigoCurso);
    const grade: Grade = { curso, codigoBase, ano, percentual: getPercentualSalvo(curso) };

    const grupo = grupos.get(curso.nomeCurso);
    if (grupo) {
      grupo.grades.push(grade);
    } else {
      grupos.set(curso.nomeCurso, { nomeCurso: curso.nomeCurso, grades: [grade] });
    }
  }

  for (const grupo of grupos.values()) {
    grupo.grades.sort((a, b) => {
      if (a.ano === b.ano) return 0;
      if (a.ano === null) return 1;
      if (b.ano === null) return -1;
      return b.ano.localeCompare(a.ano);
    });
  }

  return [...grupos.values()];
}

/** "3140" → "3.140 h" */
export function formatarHoras(horas: number): string {
  return `${horas.toLocaleString('pt-BR')} h`;
}
