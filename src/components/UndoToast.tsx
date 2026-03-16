import { useEffect, useRef } from 'react';

interface UndoToastProps {
  nomeDisciplina: string;
  cascadeCount: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ nomeDisciplina, cascadeCount, onUndo, onDismiss }: UndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  return (
    <div className="undo-toast">
      <span className="undo-toast-message">
        Desmarcou <strong>{nomeDisciplina}</strong>
        {cascadeCount > 0 && <> e <strong>{cascadeCount}</strong> dependente{cascadeCount > 1 ? 's' : ''}</>}.
      </span>
      <button className="undo-toast-btn" onClick={onUndo}>
        Desfazer
      </button>
    </div>
  );
}
