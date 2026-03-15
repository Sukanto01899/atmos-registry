type Props = {
  featureTab: "datasets" | "staking" | "alerts" | "audit" | "versions";
  onFeatureTabChange: (
    tab: "datasets" | "staking" | "alerts" | "audit" | "versions",
  ) => void;
  onMenuAction: (
    action:
      | "home"
      | "add-dataset"
      | "datasets"
      | "staking"
      | "alerts"
      | "audit"
      | "versions",
  ) => void;
  loading: boolean;
  onSyncMainnet: () => void;
  unreadAlertCount: number;
  onToggleAlerts: () => void;
  onOpenCommandPalette: () => void;
  walletAddress: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
};

import { useState } from "react";

export function NavBar({
  featureTab,
  onFeatureTabChange,
  onMenuAction,
  loading,
  onSyncMainnet,
  unreadAlertCount,
  onToggleAlerts,
  onOpenCommandPalette,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const featureTabs = [
    { id: "datasets", label: "Home" },
    { id: "staking", label: "Staking" },
    { id: "alerts", label: "Alerts" },
    { id: "audit", label: "Audit" },
    { id: "versions", label: "Versions" },
  ] as const;

  return (
    <nav className="nav">
      <div className="nav__row">
        <div className="nav__brand">
          <div className="logo-orb">A</div>
          <div>
            <div className="brand-title">Atmos Registry</div>
            <div className="brand-subtitle">Mainnet data mesh</div>
          </div>
        </div>
        <div className="nav__actions">
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
      </div>
      <div className="nav__bar">
        <div className="nav__bar-row">
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
          <div className="nav__menu">
            <button
              className="ghost-btn"
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              Menu
            </button>
            {menuOpen && (
              <div className="nav__dropdown">
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("home"); }}>
                  Home
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("add-dataset"); }}>
                  Add dataset
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("datasets"); }}>
                  Dataset list
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("staking"); }}>
                  Staking
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("alerts"); }}>
                  Alerts
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("audit"); }}>
                  Audit
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("versions"); }}>
                  Versions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
