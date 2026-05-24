type AlertLevel = "critical" | "warning" | "info";

type Props = {
  featureTab:
    | "datasets"
    | "add-dataset"
    | "staking"
    | "alerts"
    | "audit"
    | "versions"
    | "clardex";
  onFeatureTabChange: (
    tab:
      | "datasets"
      | "add-dataset"
      | "staking"
      | "alerts"
      | "audit"
      | "versions"
      | "clardex",
  ) => void;
  onMenuAction: (
    action:
      | "home"
      | "add-dataset"
      | "staking"
      | "alerts"
      | "audit"
      | "versions"
      | "clardex",
  ) => void;
  loading: boolean;
  onSyncMainnet: () => void;
  unreadAlertCount: number;
  unreadAlertLevel?: AlertLevel;
  onToggleAlerts: () => void;
  pendingTxCount: number;
  onToggleTxCenter: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  networkLabel: string;
  walletAddress: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenContractExplorer: () => void;
  onCopyContractExplorerUrl: () => void;
};

import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const shortenAddress = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-6)}`;
};

const NAV_ICONS: Record<string, string> = {
  datasets: "⌂",
  "add-dataset": "⊕",
  staking: "◈",
  alerts: "◬",
  audit: "▦",
  versions: "⊞",
  clardex: "⇄",
};

export function NavBar({
  featureTab,
  onFeatureTabChange,
  onMenuAction,
  loading,
  onSyncMainnet,
  unreadAlertCount,
  unreadAlertLevel,
  onToggleAlerts,
  pendingTxCount,
  onToggleTxCenter,
  onOpenCommandPalette,
  onOpenShortcuts,
  networkLabel,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
  onOpenContractExplorer,
  onCopyContractExplorerUrl,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  const featureTabs = [
    { id: "datasets", label: "Home" },
    { id: "add-dataset", label: "Add dataset" },
    { id: "staking", label: "Staking" },
    { id: "alerts", label: "Alerts" },
    { id: "audit", label: "Audit" },
    { id: "versions", label: "Versions" },
    { id: "clardex", label: "Clardex" },
  ] as const;

  const primaryIds = new Set<string>(["datasets", "add-dataset"]);
  const primaryTabs = featureTabs.filter((t) => primaryIds.has(t.id));
  const toolTabs = featureTabs.filter((t) => !primaryIds.has(t.id));

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

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

  const openWalletExplorer = () => {
    if (!walletAddress || typeof window === "undefined") return;
    const href = `https://explorer.hiro.so/address/${encodeURIComponent(walletAddress)}?chain=mainnet`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left sidebar */}
      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`}>
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="logo-orb"><span aria-hidden="true">◈</span></div>
          <div className="sidebar__brand-text">
            <div className="brand-title">Atmos</div>
            <div className="brand-subtitle">Registry</div>
          </div>
          <button
            className="sidebar__close"
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav">
          {primaryTabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar__item${featureTab === tab.id ? " active" : ""}`}
              onClick={() => { onFeatureTabChange(tab.id); setSidebarOpen(false); }}
            >
              <span className="sidebar__item-icon">{NAV_ICONS[tab.id]}</span>
              <span className="sidebar__item-label">{tab.label}</span>
            </button>
          ))}

          <span className="sidebar__section-label">Tools</span>

          {toolTabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar__item${featureTab === tab.id ? " active" : ""}`}
              onClick={() => { onFeatureTabChange(tab.id); setSidebarOpen(false); }}
            >
              <span className="sidebar__item-icon">{NAV_ICONS[tab.id]}</span>
              <span className="sidebar__item-label">{tab.label}</span>
              {tab.id === "alerts" && unreadAlertCount > 0 && (
                <span
                  className={`sidebar__badge sidebar__badge--alert-${unreadAlertLevel ?? "info"}`}
                >
                  {unreadAlertCount}
                </span>
              )}
              {tab.id === "staking" && pendingTxCount > 0 && (
                <span className="sidebar__badge">{pendingTxCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__footer-meta">
            {!walletAddress && (
              <span className="network-badge">{networkLabel}</span>
            )}
            <ThemeToggle />
          </div>

          {walletAddress ? (
            <div className="sidebar__wallet">
              <div className="sidebar__wallet-head">
                <span className="sidebar__wallet-dot" aria-label="Connected" />
                <span className="sidebar__wallet-addr" title={walletAddress}>
                  {shortenAddress(walletAddress)}
                </span>
                <span className="sidebar__wallet-network">{networkLabel}</span>
              </div>
              <div className="sidebar__wallet-actions">
                <button
                  className="ghost-btn compact"
                  type="button"
                  onClick={copyWalletAddress}
                  title={copied ? "Copied!" : "Copy address"}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button
                  className="ghost-btn compact"
                  type="button"
                  onClick={openWalletExplorer}
                  title="View on Hiro Explorer"
                >
                  Explorer
                </button>
                <button
                  className="ghost-btn compact"
                  type="button"
                  onClick={onDisconnectWallet}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button
              className="primary-btn sidebar__connect"
              type="button"
              onClick={onConnectWallet}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </aside>

      {/* Top bar */}
      <header className="topbar">
        {/* Mobile burger */}
        <button
          className="topbar__burger"
          type="button"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="burger-icon">
            <span />
            <span />
            <span />
          </span>
        </button>

        {/* Page title */}
        <div className="topbar__page-title">
          <em className="topbar__page-icon" aria-hidden="true">
            {NAV_ICONS[featureTab] ?? "⌂"}
          </em>
          {featureTabs.find((t) => t.id === featureTab)?.label ?? "Home"}
        </div>

        <div className="topbar__actions">
          {/* Sync */}
          <button
            className={`ghost-btn topbar__sync${loading ? " loading" : ""}`}
            onClick={onSyncMainnet}
            disabled={loading}
            title="Sync on-chain data"
          >
            <span className="topbar__sync-icon" aria-hidden="true">↻</span>
            <span className="topbar__action-label">{loading ? "Syncing…" : "Sync"}</span>
          </button>

          <span className="topbar__divider" aria-hidden="true" />

          {/* Alerts */}
          <button
            className="topbar__action-btn"
            type="button"
            onClick={onToggleAlerts}
            title="Alerts"
            aria-label={`Alerts${unreadAlertCount > 0 ? ` (${unreadAlertCount} unread)` : ""}`}
          >
            <span aria-hidden="true">◬</span>
            {unreadAlertCount > 0 && (
              <span
                className={`topbar__float-badge topbar__float-badge--alert-${unreadAlertLevel ?? "info"}`}
              >
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* Tx center */}
          <button
            className="topbar__action-btn"
            type="button"
            onClick={onToggleTxCenter}
            title="Transaction center"
            aria-label={`Transactions${pendingTxCount > 0 ? ` (${pendingTxCount} pending)` : ""}`}
          >
            <span aria-hidden="true">⊡</span>
            {pendingTxCount > 0 && (
              <span className="topbar__float-badge topbar__float-badge--green">{pendingTxCount}</span>
            )}
          </button>

          <span className="topbar__divider" aria-hidden="true" />

          {/* Command palette */}
          <button
            className="topbar__cmd"
            type="button"
            onClick={onOpenCommandPalette}
            title="Open command palette"
          >
            <kbd aria-hidden="true">⌘K</kbd>
          </button>

          {/* Keyboard shortcuts */}
          <button
            className="topbar__action-btn"
            type="button"
            onClick={onOpenShortcuts}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts"
          >
            <span aria-hidden="true" style={{ fontSize: "0.82rem", fontWeight: 700 }}>?</span>
          </button>

          <span className="topbar__divider" aria-hidden="true" />

          {/* Wallet */}
          {walletAddress ? (
            <button
              className="topbar__wallet-chip"
              type="button"
              onClick={copyWalletAddress}
              title={copied ? "Copied!" : walletAddress}
            >
              <span className="topbar__wallet-dot" aria-hidden="true" />
              <span>{copied ? "Copied!" : shortenAddress(walletAddress)}</span>
            </button>
          ) : (
            <button
              className="primary-btn compact topbar__connect"
              type="button"
              onClick={onConnectWallet}
            >
              Connect wallet
            </button>
          )}

          {/* More menu */}
          <div className="topbar__menu" ref={menuRef}>
            <button
              className="topbar__action-btn"
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              title="More options"
              aria-label="More options"
            >
              <span aria-hidden="true" style={{ letterSpacing: "0.08em", fontSize: "0.7rem" }}>···</span>
            </button>
            {menuOpen && (
              <div className="nav__dropdown">
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("home"); }}>
                  ⌂ Home
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onOpenContractExplorer(); }}>
                  ⬡ Contract explorer
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onCopyContractExplorerUrl(); }}>
                  ⎘ Copy contract URL
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("add-dataset"); }}>
                  ⊕ Add dataset
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("staking"); }}>
                  ◈ Staking
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("alerts"); }}>
                  ◬ Alerts
                  {unreadAlertCount > 0 && (
                    <span
                      className={`nav__dropdown-badge nav__dropdown-badge--alert-${unreadAlertLevel ?? "info"}`}
                    >
                      {unreadAlertCount}
                    </span>
                  )}
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("audit"); }}>
                  ▦ Audit
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction("versions"); }}>
                  ⊞ Versions
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
