import { useEffect } from "react";

type ShortcutItem = {
  keys: string;
  description: string;
};

type Props = {
  open: boolean;
  shortcuts: ShortcutItem[];
  onClose: () => void;
  onOpenCommandPalette: () => void;
};

export function KeyboardShortcutsModal({
  open,
  shortcuts,
  onClose,
  onOpenCommandPalette,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div
        className="shortcuts-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="shortcuts-head">
          <div>
            <strong>Keyboard Shortcuts</strong>
            <p>Fast ways to move through Atmos without reaching for the mouse.</p>
          </div>
          <button className="ghost-btn compact" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="shortcuts-list">
          {shortcuts.map((shortcut) => (
            <div className="shortcut-row" key={shortcut.keys}>
              <span className="shortcut-row__keys">{shortcut.keys}</span>
              <span className="shortcut-row__description">
                {shortcut.description}
              </span>
            </div>
          ))}
        </div>
        <div className="shortcuts-foot">
          <button
            className="ghost-btn"
            type="button"
            onClick={() => {
              onClose();
              onOpenCommandPalette();
            }}
          >
            Open Command Palette
          </button>
        </div>
      </div>
    </div>
  );
}
