
// ─── App — Navigation + Wallet State ─────────────────────────────────────────
function App() {
  const [wallet, setWallet] = React.useState(null);       // { address, shortAddr }
  const [connecting, setConnecting] = React.useState(false);
  const [view, setView] = React.useState("trips");         // trips | myres | posttrip | mytrips
  const [role, setRole] = React.useState("passenger");     // passenger | driver
  const [toast, setToast] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const connectWallet = async () => {
    setConnecting(true);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const addr = accounts[0];
        setWallet({ address: addr, short: addr.slice(0, 6) + "…" + addr.slice(-4) });
        showToast("Wallet connecté !");
      } else {
        // Demo mode — no MetaMask
        await new Promise(r => setTimeout(r, 1200));
        const fakeAddr = "0xdemo1234567890abcdef1234567890abcdef1234";
        setWallet({ address: fakeAddr, short: "0xdemo…ef34", demo: true });
        showToast("Mode démo activé (pas de MetaMask détecté)");
      }
    } catch (e) {
      showToast("Connexion refusée", "error");
    }
    setConnecting(false);
  };

  const disconnect = () => {
    setWallet(null);
    setView("trips");
  };

  const handleRequest = (trip) => {
    showToast(`Demande envoyée pour ${trip.from} → ${trip.to} !`);
  };

  const navItems = role === "passenger"
    ? [
        { id: "trips",  label: "Trajets",          icon: "🔍" },
        { id: "myres",  label: "Mes réservations",  icon: "🎫" },
      ]
    : [
        { id: "posttrip", label: "Publier",   icon: "+" },
        { id: "mytrips",  label: "Mes trajets", icon: "🚗" },
      ];

  if (!wallet) {
    return <LandingView onConnect={connectWallet} connecting={connecting} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "inherit" }}>
      {/* Nav */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: `${T.bg}e8`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.borderFaint}`,
        padding: "0 24px",
        height: 58,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: T.accentDim, border: `1px solid ${T.accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M6 20 C6 20 8 14 16 14 C24 14 26 20 26 20" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="10" cy="21" r="3" stroke={T.accent} strokeWidth="2.5"/>
              <circle cx="22" cy="21" r="3" stroke={T.accent} strokeWidth="2.5"/>
              <path d="M13 21 L19 21" stroke={T.accent} strokeWidth="2.5"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.02em" }}>
            RideChain
          </span>
        </div>

        {/* Nav links — desktop */}
        <nav style={{ display: "flex", gap: 4, flex: 1 }} className="desktop-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                background: view === item.id ? T.accentDim : "transparent",
                border: view === item.id ? `1px solid ${T.accent}30` : "1px solid transparent",
                borderRadius: 8, padding: "6px 14px",
                color: view === item.id ? T.accent : T.textSecondary,
                fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          {/* Role toggle */}
          <div style={{
            display: "flex",
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 8, padding: 3, gap: 3,
          }}>
            {["passenger", "driver"].map(r => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setView(r === "passenger" ? "trips" : "mytrips");
                }}
                style={{
                  background: role === r ? T.bgElevated : "transparent",
                  border: "none", borderRadius: 6,
                  padding: "4px 12px",
                  color: role === r ? T.textPrimary : T.textMuted,
                  fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {r === "passenger" ? "Passager" : "Conducteur"}
              </button>
            ))}
          </div>

          {/* Wallet chip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: wallet.demo ? T.amber : T.green,
              flexShrink: 0,
            }}></div>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, fontFamily: "monospace" }}>
              {wallet.short}
            </span>
            <button
              onClick={disconnect}
              style={{
                background: "none", border: "none",
                color: T.textMuted, cursor: "pointer",
                fontSize: 14, lineHeight: 1, padding: "0 0 0 4px",
              }}
              title="Déconnecter"
            >×</button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav style={{
        display: "none",
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99,
        background: T.bgCard,
        borderTop: `1px solid ${T.borderFaint}`,
        padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
      }} className="mobile-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              flex: 1, background: "none", border: "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: view === item.id ? T.accent : T.textMuted,
              fontSize: 10, fontWeight: 600, fontFamily: "inherit",
              cursor: "pointer", padding: "6px 0",
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ paddingBottom: 80 }}>
        {view === "trips"    && <TripsPage onRequest={handleRequest} />}
        {view === "myres"    && <MyReservationsView />}
        {view === "posttrip" && <PostTripView />}
        {view === "mytrips"  && <MyTripsView />}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          zIndex: 999,
          background: toast.type === "error" ? T.redDim : T.bgElevated,
          border: `1px solid ${toast.type === "error" ? T.red : T.border}`,
          color: toast.type === "error" ? T.red : T.textPrimary,
          padding: "12px 20px", borderRadius: 10,
          fontSize: 14, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "fadeUp 0.25s ease",
          whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
