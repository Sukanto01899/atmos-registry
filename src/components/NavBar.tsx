type Props = {
  featureTab: "datasets" | "staking" | "alerts" | "audit" | "versions";
  onFeatureTabChange: (
    tab: "datasets" | "staking" | "alerts" | "audit" | "versions",
  ) => void;
  showDatasetTabs: boolean;
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
  featureTab,
  onFeatureTabChange,
  showDatasetTabs,
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
  const featureTabs = [
    { id: "datasets", label: "Datasets" },
    { id: "staking", label: "Staking" },
    { id: "alerts", label: "Alerts" },
    { id: "audit", label: "Audit" },
    { id: "versions", label: "Versions" },
  ] as const;

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
        <div className="nav__tabs">
          {featureTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${featureTab === tab.id ? "active" : ""}`}
              onClick={() => onFeatureTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {showDatasetTabs && (
          <div className="nav__tabs nav__tabs--sub">
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
          </div>
        )}
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
