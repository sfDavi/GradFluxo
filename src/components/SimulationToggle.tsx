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
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12.2L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
        />
      </svg>
      <span>{active ? 'Simulando' : 'Simular'}</span>
    </button>
  );
}
