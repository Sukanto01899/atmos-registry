type Props = {
  featureTab:
    | "datasets"
    | "add-dataset"
    | "staking"
    | "alerts"
    | "audit"
    | "versions";
  onFeatureTabChange: (
    tab:
      | "datasets"
      | "add-dataset"
      | "staking"
      | "alerts"
      | "audit"
      | "versions",
  ) => void;
  onMenuAction: (
    action:
      | "home"
      | "add-dataset"
      | "staking"
      | "alerts"
      | "audit"
      | "versions",
  ) => void;
  loading: boolean;
  onSyncMainnet: () => void;
  unreadAlertCount: number;
  onToggleAlerts: () => void;
  pendingTxCount: number;
  onToggleTxCenter: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  walletAddress: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
};

import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar({
  featureTab,
  onFeatureTabChange,
  onMenuAction,
  loading,
  onSyncMainnet,
  unreadAlertCount,
  onToggleAlerts,
  pendingTxCount,
  onToggleTxCenter,
  onOpenCommandPalette,
  onOpenShortcuts,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const featureTabs = [
    { id: "datasets", label: "Home" },
    { id: "add-dataset", label: "Add dataset" },
    { id: "staking", label: "Staking" },
    { id: "alerts", label: "Alerts" },
    { id: "audit", label: "Audit" },
    { id: "versions", label: "Versions" },
  ] as const;

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const copyWalletAddress = async () => {
    if (!walletAddress) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(walletAddress);
      } else {
        const el = document.createElement("textarea");
        el.value = walletAddress;
        el.setAttribute("readonly", "true");
        el.style.position = "fixed";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

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
          <ThemeToggle />
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
            <span
              className={`alert-count ${unreadAlertCount > 0 ? "active" : ""}`}
            >
              {unreadAlertCount}
            </span>
          </button>
          <button
            className="ghost-btn alert-bell"
            type="button"
            onClick={onToggleTxCenter}
          >
            Tx
            <span className={`alert-count ${pendingTxCount > 0 ? "active" : ""}`}>
              {pendingTxCount}
            </span>
          </button>
          <button
            className="ghost-btn"
            type="button"
            onClick={onOpenCommandPalette}
          >
            Command
          </button>
          <button className="ghost-btn" type="button" onClick={onOpenShortcuts}>
            Shortcuts
          </button>
          {walletAddress ? (
            <div className="wallet-chip">
              <span className="wallet-address">{walletAddress}</span>
              <button
                className="ghost-btn compact"
                type="button"
                onClick={copyWalletAddress}
                aria-label="Copy wallet address"
                title={copied ? "Copied!" : "Copy"}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                className="ghost-btn compact"
                type="button"
                onClick={onDisconnectWallet}
              >
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
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onMenuAction("home");
                  }}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onMenuAction("add-dataset");
                  }}
                >
                  Add dataset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onMenuAction("staking");
                  }}
                >
                  Staking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onMenuAction("alerts");
                  }}
                >
                  Alerts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onMenuAction("audit");
                  }}
                >
                  Audit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onMenuAction("versions");
                  }}
                >
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



