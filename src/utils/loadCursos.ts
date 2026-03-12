import type { Curso } from '../types';

const CURSOS_DIR = '/cursos';

export async function loadCursos(): Promise<Curso[]> {
  const indexResponse = await fetch(`${CURSOS_DIR}/index.json`);
  const filenames: string[] = await indexResponse.json();

  const cursos = await Promise.all(
    filenames.map(async (filename) => {
      const response = await fetch(`${CURSOS_DIR}/${filename}`);
      const curso: Curso = await response.json();
      return curso;
    })
  );

  return cursos;
}
