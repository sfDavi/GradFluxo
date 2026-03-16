export type Nucleo = 'comum' | 'livre' | 'especifico' | 'optativo';

export type Status = 'cursada' | 'cursavel' | 'nao_cursavel';

export interface Disciplina {
  codigoDisciplina: string;
  nomeDisciplina: string;
  semestre: number;
  cargaHoraria: number;
  nucleo: Nucleo;
  prerequisitos: string[];
  ementa?: string;
}

export interface Curso {
  codigoCurso: string;
  nomeCurso: string;
  numeroSemestres: number;
  cargaHorariaTotal: number;
  cargaHorariaNucleoComum: number;
  cargaHorariaNucleoLivre: number;
  cargaHorariaNucleoEspecifico: number;
  cargaHorariaNucleoOptativo: number;
  disciplinas: Disciplina[];
}
