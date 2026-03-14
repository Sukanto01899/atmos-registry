type CommandAction = {
  id: string;
  label: string;
  detail: string;
  run: () => void;
};

type Props = {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  actions: CommandAction[];
  onClose: () => void;
  onSelect: (action: CommandAction) => void;
};

export function CommandPalette({
  open,
  query,
  onQueryChange,
  actions,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <div className="command-overlay" onClick={onClose}>
      <div className="command-modal" onClick={(event) => event.stopPropagation()}>
        <div className="command-head">
          <strong>Command Palette</strong>
          <span>Ctrl/Cmd + K</span>
        </div>
        <input
          className="command-search"
          autoFocus
          value={query}
          onChange={(event) => onQueryChange((event.target as HTMLInputElement).value)}
          placeholder="Search commands..."
        />
        <div className="command-list">
          {actions.length === 0 && (
            <div className="command-empty">No commands matched your query.</div>
          )}
          {actions.map((action) => (
            <button
              key={action.id}
              className="command-item"
              type="button"
              onClick={() => onSelect(action)}
            >
              <span>{action.label}</span>
              <small>{action.detail}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

