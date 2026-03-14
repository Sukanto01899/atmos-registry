type Notice = {
  id: string;
  tone: "info" | "warning" | "critical";
  message: string;
};

type Props = {
  notices: Notice[];
};

export function AppNotices({ notices }: Props) {
  if (notices.length === 0) return null;

  return (
    <div className="app-notices">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={`status-banner status-banner--${notice.tone}`}
        >
          {notice.message}
        </div>
      ))}
    </div>
  );
}

