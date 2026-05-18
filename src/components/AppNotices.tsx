import { Props } from "../type";

const TONE_ICON: Record<string, string> = {
  info: "ℹ",
  warning: "⚠",
  critical: "✕",
};

export function AppNotices({ notices, onDismissNotice }: Props) {
  if (notices.length === 0) return null;

  return (
    <div className="app-notices">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={`status-banner status-banner--${notice.tone}`}
        >
          <span className="status-banner__icon" aria-hidden="true">
            {TONE_ICON[notice.tone] ?? "ℹ"}
          </span>
          <div className="status-banner__body">{notice.message}</div>
          {onDismissNotice && (
            <button
              className="status-banner__close"
              type="button"
              aria-label="Dismiss notice"
              onClick={() => onDismissNotice(notice.id)}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
