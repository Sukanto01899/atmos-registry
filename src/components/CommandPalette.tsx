import { useEffect, useMemo, useState } from "react";
import { CommandPaletteProps } from "../type";

export function CommandPalette({
  open,
  query,
  onQueryChange,
  actions,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  if (!open) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const hasActions = actions.length > 0;
  const boundedIndex = useMemo(() => {
    if (!hasActions) return 0;
    return Math.max(0, Math.min(actions.length - 1, activeIndex));
  }, [actions.length, activeIndex, hasActions]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open, actions.length]);

  return (
    <div className="command-overlay" onClick={onClose}>
      <div
        className="command-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="command-head">
          <strong>Command Palette</strong>
          <span>Ctrl/Cmd + K</span>
        </div>
        <input
          className="command-search"
          autoFocus
          value={query}
          onChange={(event) =>
            onQueryChange((event.target as HTMLInputElement).value)
          }
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              if (!hasActions) return;
              setActiveIndex((prev) =>
                prev + 1 >= actions.length ? 0 : prev + 1,
              );
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (!hasActions) return;
              setActiveIndex((prev) =>
                prev - 1 < 0 ? actions.length - 1 : prev - 1,
              );
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (!hasActions) return;
              onSelect(actions[boundedIndex]);
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder="Search commands..."
        />
        <div className="command-list">
          {actions.length === 0 && (
            <div className="command-empty">No commands matched your query.</div>
          )}
          {actions.map((action) => (
            <button
              key={action.id}
              className={`command-item ${
                action.id === actions[boundedIndex]?.id ? "active" : ""
              }`}
              type="button"
              onClick={() => onSelect(action)}
              onMouseEnter={() =>
                setActiveIndex(
                  actions.findIndex((item) => item.id === action.id),
                )
              }
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
