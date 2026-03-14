type Props = {
  activeTab: "explore" | "mine";
  onTabChange: (tab: "explore" | "mine") => void;
  loading: boolean;
  onSyncMainnet: () => void;
  unreadAlertCount: number;
  onToggleAlerts: () => void;
  onOpenCommandPalette: () => void;
  walletAddress: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
};

export function NavBar({
  activeTab,
  onTabChange,
  loading,
  onSyncMainnet,
  unreadAlertCount,
  onToggleAlerts,
  onOpenCommandPalette,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
}: Props) {
  return (
    <nav className="nav">
      <div className="nav__brand">
        <div className="logo-orb">A</div>
        <div>
          <div className="brand-title">Atmos Registry</div>
          <div className="brand-subtitle">Mainnet data mesh</div>
        </div>
      </div>
      <div className="nav__actions">
        <button
          className={`tab-btn ${activeTab === "explore" ? "active" : ""}`}
          onClick={() => onTabChange("explore")}
        >
          Explore
        </button>
        <button
          className={`tab-btn ${activeTab === "mine" ? "active" : ""}`}
          onClick={() => onTabChange("mine")}
        >
          My Datasets
        </button>
        <button
          className="ghost-btn"
          onClick={onSyncMainnet}
          disabled={loading}
        >
          {loading ? "Syncing..." : "Sync Mainnet"}
        </button>
        <button
          className="ghost-btn alert-bell"
          type="button"
          onClick={onToggleAlerts}
        >
          Alerts
          <span className={`alert-count ${unreadAlertCount > 0 ? "active" : ""}`}>
            {unreadAlertCount}
          </span>
        </button>
        <button className="ghost-btn" type="button" onClick={onOpenCommandPalette}>
          Command
        </button>
        {walletAddress ? (
          <div className="wallet-chip">
            <span className="wallet-address">{walletAddress}</span>
            <button className="ghost-btn" onClick={onDisconnectWallet}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="primary-btn compact" onClick={onConnectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}

