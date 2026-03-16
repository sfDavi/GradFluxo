import { useCallback, useRef, useState } from 'react';
import type { Curso } from '../types';

interface ImportButtonProps {
  curso: Curso;
  validCodes: Set<string>;
  onImport: (cursadas: Set<string>) => void;
}

interface Toast {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export function ImportButton({ curso, validCodes, onImport }: ImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pendingImport, setPendingImport] = useState<string[] | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((t: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const executeImport = useCallback(
    (codes: string[]) => {
      const valid: string[] = [];
      const invalid: string[] = [];
      for (const c of codes) {
        if (validCodes.has(c)) valid.push(c);
        else invalid.push(c);
      }
      onImport(new Set(valid));
      let msg = `Importadas ${valid.length} disciplinas com sucesso.`;
      if (invalid.length > 0) {
        msg += ` ${invalid.length} código(s) ignorado(s): ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '…' : ''}`;
      }
      showToast({ type: invalid.length > 0 ? 'warning' : 'success', message: msg });
      setPendingImport(null);
    },
    [validCodes, onImport, showToast]
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input so same file can be re-selected
      e.target.value = '';

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (!data || !data.versao || !Array.isArray(data.cursadas)) {
            showToast({ type: 'error', message: 'Arquivo inválido: estrutura JSON incorreta.' });
            return;
          }

          if (data.codigoCurso && data.codigoCurso !== curso.codigoCurso) {
            // Course mismatch — ask for confirmation
            setPendingImport(data.cursadas);
            return;
          }

          executeImport(data.cursadas);
        } catch {
          showToast({ type: 'error', message: 'Arquivo inválido: JSON malformado.' });
        }
      };
      reader.readAsText(file);
    },
    [curso.codigoCurso, executeImport, showToast]
  );

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <button
        className="export-button"
        onClick={() => fileRef.current?.click()}
        title="Importar progresso"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 10V1M8 1L5 4M8 1l3 3M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Importar
      </button>

      {pendingImport && (
        <>
          <div className="drawer-backdrop" onClick={() => setPendingImport(null)} />
          <div className="import-confirm-dialog">
            <p className="import-confirm-text">
              O arquivo pertence a outro curso. Deseja importar mesmo assim?
            </p>
            <div className="import-confirm-actions">
              <button className="import-confirm-btn import-confirm-cancel" onClick={() => setPendingImport(null)}>
                Cancelar
              </button>
              <button className="import-confirm-btn import-confirm-ok" onClick={() => executeImport(pendingImport)}>
                Importar
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`import-toast import-toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button className="import-toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </>
  );
}
