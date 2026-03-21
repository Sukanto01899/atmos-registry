import { useEffect, useMemo, useState } from "react";
import { CommandPaletteProps } from "../type";

export function CommandPalette({
  open,
  query,
  onQueryChange,
  actions,
  recentActions,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  if (!open) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const queryTrimmed = query.trim().toLowerCase();
  const showRecent = !queryTrimmed && recentActions.length > 0;
  const recentIds = useMemo(
    () => new Set(recentActions.map((action) => action.id)),
    [recentActions],
  );
  const baseActions = useMemo(() => {
    if (!showRecent) return actions;
    return actions.filter((action) => !recentIds.has(action.id));
  }, [actions, recentIds, showRecent]);
  const displayActions = useMemo(
    () => (showRecent ? [...recentActions, ...baseActions] : actions),
    [actions, baseActions, recentActions, showRecent],
  );
  const hasActions = displayActions.length > 0;
  const boundedIndex = useMemo(() => {
    if (!hasActions) return 0;
    return Math.max(0, Math.min(displayActions.length - 1, activeIndex));
  }, [activeIndex, displayActions.length, hasActions]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open, displayActions.length]);

  const groupedActions = useMemo(() => {
    const groups: Record<string, typeof baseActions> = {};
    baseActions.forEach((action) => {
      const group = action.group ?? "Other";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(action);
    });
    return groups;
  }, [baseActions]);

  const groupOrder = ["Navigation", "Data", "Alerts", "Other"];

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
                prev + 1 >= displayActions.length ? 0 : prev + 1,
              );
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (!hasActions) return;
              setActiveIndex((prev) =>
                prev - 1 < 0 ? displayActions.length - 1 : prev - 1,
              );
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (!hasActions) return;
              onSelect(displayActions[boundedIndex]);
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
          {displayActions.length === 0 && (
            <div className="command-empty">No commands matched your query.</div>
          )}
          {showRecent && recentActions.length > 0 && (
            <div className="command-group">
              <div className="command-group__title">Recent</div>
              {recentActions.map((action) => (
                <button
                  key={`recent-${action.id}`}
                  className={`command-item ${
                    action.id === displayActions[boundedIndex]?.id ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => onSelect(action)}
                  onMouseEnter={() =>
                    setActiveIndex(
                      displayActions.findIndex((item) => item.id === action.id),
                    )
                  }
                >
                  <span>{action.label}</span>
                  <small>{action.detail}</small>
                </button>
              ))}
            </div>
          )}
          {groupOrder
            .filter((group) => groupedActions[group]?.length)
            .map((group) => (
              <div className="command-group" key={group}>
                <div className="command-group__title">{group}</div>
                {groupedActions[group].map((action) => (
                  <button
                    key={action.id}
                    className={`command-item ${
                      action.id === displayActions[boundedIndex]?.id
                        ? "active"
                        : ""
                    }`}
                    type="button"
                    onClick={() => onSelect(action)}
                    onMouseEnter={() =>
                      setActiveIndex(
                        displayActions.findIndex(
                          (item) => item.id === action.id,
                        ),
                      )
                    }
                  >
                    <span>{action.label}</span>
                    <small>{action.detail}</small>
                  </button>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
