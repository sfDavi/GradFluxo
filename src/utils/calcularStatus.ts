import type { Disciplina, Status } from '../types';

export function calcularStatus(
  disciplinas: Disciplina[],
  cursadas: Set<string>
): Map<string, Status> {
  const statusMap = new Map<string, Status>();

  for (const disciplina of disciplinas) {
    const codigo = disciplina.codigoDisciplina;

    if (cursadas.has(codigo)) {
      statusMap.set(codigo, 'cursada');
    } else if (
      disciplina.prerequisitos.length === 0 ||
      disciplina.prerequisitos.every((pre) => cursadas.has(pre))
    ) {
      statusMap.set(codigo, 'cursavel');
    } else {
      statusMap.set(codigo, 'nao_cursavel');
    }
  }

  return statusMap;
}
