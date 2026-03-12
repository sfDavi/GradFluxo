interface SimulationToggleProps {
  active: boolean;
  onToggle: () => void;
}

export function SimulationToggle({ active, onToggle }: SimulationToggleProps) {
  return (
    <button
      className={`simulation-toggle${active ? ' is-active' : ''}`}
      onClick={onToggle}
      title={active ? 'Desativar modo simulação' : 'Ativar modo simulação'}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 1v2M8 13v2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M1 8h2M13 8h2M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span>{active ? 'Simulação Ativa' : 'Simular'}</span>
    </button>
  );
}
