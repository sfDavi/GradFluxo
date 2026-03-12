import type { Curso } from '../types';

interface ExportButtonProps {
  curso: Curso;
  cursadas: Set<string>;
}

export function ExportButton({ curso, cursadas }: ExportButtonProps) {
  const handleExport = () => {
    const data = {
      versao: '1.0',
      codigoCurso: curso.codigoCurso,
      nomeCurso: curso.nomeCurso,
      cursadas: [...cursadas],
      dataExportacao: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `gradfluxo-${curso.codigoCurso}-${today}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="export-button" onClick={handleExport} title="Exportar progresso">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1v9M8 10L5 7M8 10l3-3M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Exportar
    </button>
  );
}
