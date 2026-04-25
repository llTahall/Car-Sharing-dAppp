
// ─── Design Tokens ───────────────────────────────────────────────────────────
const T = {
  bg:        "oklch(0.20 0.03 240)",
  bgCard:    "oklch(0.24 0.028 240)",
  bgElevated:"oklch(0.28 0.025 240)",
  border:    "oklch(0.34 0.022 240)",
  borderFaint:"oklch(0.29 0.022 240)",
  accent:    "oklch(0.72 0.17 168)",   // mint teal
  accentDim: "oklch(0.72 0.17 168 / 0.15)",
  accentHover:"oklch(0.78 0.17 168)",
  amber:     "oklch(0.78 0.16 70)",    // pending/warning
  amberDim:  "oklch(0.78 0.16 70 / 0.15)",
  red:       "oklch(0.65 0.18 20)",
  redDim:    "oklch(0.65 0.18 20 / 0.15)",
  green:     "oklch(0.72 0.17 145)",
  greenDim:  "oklch(0.72 0.17 145 / 0.15)",
  gray:      "oklch(0.45 0.01 240)",
  grayDim:   "oklch(0.45 0.01 240 / 0.15)",
  textPrimary:  "oklch(0.93 0.01 240)",
  textSecondary:"oklch(0.62 0.01 240)",
  textMuted:    "oklch(0.42 0.01 240)",
};
window.T = T;

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TRIPS = [
  {
    id: "0x01",
    driver: "0xAbC1",
    driverName: "Mehdi B.",
    driverRating: 4.8,
    driverTrips: 47,
    from: "Paris — Gare de Lyon",
    to: "Lyon — Part-Dieu",
    date: "2026-05-03",
    time: "08:30",
    priceEth: "0.012",
    seats: 3,
    seatsTotal: 4,
    status: "PUBLIEE",
    carModel: "Tesla Model 3",
  },
  {
    id: "0x02",
    driver: "0xDeF2",
    driverName: "Sophie L.",
    driverRating: 4.5,
    driverTrips: 23,
    from: "Marseille — Saint-Charles",
    to: "Aix-en-Provence",
    date: "2026-05-04",
    time: "09:00",
    priceEth: "0.004",
    seats: 2,
    seatsTotal: 3,
    status: "PUBLIEE",
    carModel: "Renault Zoe",
  },
  {
    id: "0x03",
    driver: "0xGhI3",
    driverName: "Thomas R.",
    driverRating: 4.1,
    driverTrips: 12,
    from: "Bordeaux — Gare",
    to: "Toulouse — Matabiau",
    date: "2026-05-05",
    time: "14:15",
    priceEth: "0.008",
    seats: 1,
    seatsTotal: 2,
    status: "PUBLIEE",
    carModel: "Peugeot 308",
  },
  {
    id: "0x04",
    driver: "0xJkL4",
    driverName: "Clara M.",
    driverRating: 5.0,
    driverTrips: 89,
    from: "Nantes — Gare",
    to: "Rennes — Gare",
    date: "2026-05-06",
    time: "07:00",
    priceEth: "0.006",
    seats: 3,
    seatsTotal: 4,
    status: "PUBLIEE",
    carModel: "BMW i3",
  },
  {
    id: "0x05",
    driver: "0xMnO5",
    driverName: "Arnaud V.",
    driverRating: 3.9,
    driverTrips: 8,
    from: "Strasbourg — Gare",
    to: "Mulhouse",
    date: "2026-05-07",
    time: "17:45",
    priceEth: "0.003",
    seats: 2,
    seatsTotal: 3,
    status: "PUBLIEE",
    carModel: "Citroën C4",
  },
];

const MOCK_MY_RESERVATIONS = [
  {
    id: "res-01",
    tripId: "0x01",
    from: "Paris — Gare de Lyon",
    to: "Lyon — Part-Dieu",
    date: "2026-05-03",
    time: "08:30",
    priceEth: "0.012",
    driverName: "Mehdi B.",
    driverRating: 4.8,
    status: "ACCEPTEE",
  },
  {
    id: "res-02",
    tripId: "0x07",
    from: "Paris — Montparnasse",
    to: "Chartres",
    date: "2026-04-20",
    time: "11:00",
    priceEth: "0.005",
    driverName: "Lucie D.",
    driverRating: 4.3,
    status: "EN_ATTENTE",
  },
  {
    id: "res-03",
    tripId: "0x09",
    from: "Nice — Gare",
    to: "Monaco",
    date: "2026-04-10",
    time: "09:30",
    priceEth: "0.003",
    driverName: "Pierre F.",
    driverRating: 4.6,
    status: "ANNULEE_PASSAGER",
  },
];

const MOCK_MY_TRIPS = [
  {
    id: "0xA1",
    from: "Paris — Gare du Nord",
    to: "Brussels — Midi",
    date: "2026-05-10",
    time: "10:00",
    priceEth: "0.018",
    seats: 3,
    seatsTotal: 3,
    status: "PUBLIEE",
    reservations: [
      { id: "r01", passenger: "0xPass1", passengerName: "Alice K.", seats: 1, status: "EN_ATTENTE" },
      { id: "r02", passenger: "0xPass2", passengerName: "Bob N.", seats: 1, status: "EN_ATTENTE" },
      { id: "r03", passenger: "0xPass3", passengerName: "Camille T.", seats: 1, status: "ACCEPTEE" },
    ],
  },
  {
    id: "0xA2",
    from: "Paris — Bercy",
    to: "Dijon — Gare",
    date: "2026-04-15",
    time: "07:30",
    priceEth: "0.009",
    seats: 2,
    seatsTotal: 2,
    status: "COMPLETE",
    reservations: [
      { id: "r04", passenger: "0xPass4", passengerName: "Diane M.", seats: 1, status: "ACCEPTEE" },
      { id: "r05", passenger: "0xPass5", passengerName: "Ethan R.", seats: 1, status: "ACCEPTEE" },
    ],
  },
  {
    id: "0xA3",
    from: "Lille — Flandres",
    to: "Amiens — Gare",
    date: "2026-03-28",
    time: "15:00",
    priceEth: "0.004",
    seats: 2,
    seatsTotal: 2,
    status: "TERMINEE",
    reservations: [
      { id: "r06", passenger: "0xPass6", passengerName: "Fatima Z.", seats: 2, status: "ACCEPTEE" },
    ],
  },
];

window.MOCK_TRIPS = MOCK_TRIPS;
window.MOCK_MY_RESERVATIONS = MOCK_MY_RESERVATIONS;
window.MOCK_MY_TRIPS = MOCK_MY_TRIPS;

// ─── Shared Components ────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  // Trip statuses
  PUBLIEE:           { label: "Active",     color: T.green,  bg: T.greenDim },
  COMPLETE:          { label: "En route",   color: T.accent, bg: T.accentDim },
  TERMINEE:          { label: "Terminée",   color: T.gray,   bg: T.grayDim },
  ANNULEE:           { label: "Annulée",    color: T.red,    bg: T.redDim },
  // Reservation statuses
  EN_ATTENTE:        { label: "En attente", color: T.amber,  bg: T.amberDim },
  ACCEPTEE:          { label: "Acceptée",   color: T.green,  bg: T.greenDim },
  REFUSEE_CONDUCTEUR:{ label: "Refusée",    color: T.red,    bg: T.redDim },
  ANNULEE_PASSAGER:  { label: "Annulée",    color: T.gray,   bg: T.grayDim },
  ANNULEE_CONDUCTEUR:{ label: "Annulée",    color: T.red,    bg: T.redDim },
};
window.STATUS_CONFIG = STATUS_CONFIG;

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: T.gray, bg: T.grayDim };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 100,
      background: cfg.bg,
      color: cfg.color,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
      border: `1px solid ${cfg.color}40`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, flexShrink: 0 }}></span>
      {cfg.label}
    </span>
  );
}

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const frac = rating - full;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: T.textSecondary }}>
      <span style={{ color: "#f5c542", fontSize: 13 }}>
        {"★".repeat(full)}{frac >= 0.5 ? "½" : ""}{"☆".repeat(5 - full - (frac >= 0.5 ? 1 : 0))}
      </span>
      <span style={{ fontSize: 12, color: T.textSecondary, fontWeight: 500 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function Btn({ children, variant = "primary", size = "md", onClick, disabled, loading, style }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    border: "none", borderRadius: 8, cursor: disabled || loading ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 600, letterSpacing: "0.02em",
    transition: "all 0.15s ease",
    opacity: disabled ? 0.45 : 1,
    position: "relative", overflow: "hidden",
  };
  const sizes = {
    sm: { padding: "6px 14px", fontSize: 12 },
    md: { padding: "10px 20px", fontSize: 14 },
    lg: { padding: "14px 28px", fontSize: 15 },
  };
  const variants = {
    primary: { background: T.accent, color: "#0a1a14" },
    ghost: { background: "transparent", color: T.textSecondary, border: `1px solid ${T.border}` },
    danger: { background: T.redDim, color: T.red, border: `1px solid ${T.red}40` },
    amber: { background: T.amberDim, color: T.amber, border: `1px solid ${T.amber}40` },
    outline: { background: "transparent", color: T.accent, border: `1px solid ${T.accent}60` },
  };

  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onClick={disabled || loading ? undefined : onClick}
    >
      {loading && (
        <span style={{
          width: 12, height: 12, border: "2px solid currentColor",
          borderTopColor: "transparent", borderRadius: "50%",
          animation: "spin 0.7s linear infinite", flexShrink: 0,
        }}></span>
      )}
      {children}
    </button>
  );
}

function Card({ children, style, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${hov && onClick ? T.border : T.borderFaint}`,
        borderRadius: 14,
        padding: 20,
        transition: "all 0.18s ease",
        transform: hov && onClick ? "translateY(-1px)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      margin: "0 0 24px 0", fontSize: 22, fontWeight: 700,
      color: T.textPrimary, letterSpacing: "-0.02em",
    }}>
      {children}
    </h2>
  );
}

function Divider() {
  return <div style={{ height: 1, background: T.borderFaint, margin: "16px 0" }}></div>;
}

function EmptyState({ icon, message }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 20px", gap: 12,
      color: T.textMuted, textAlign: "center",
    }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <span style={{ fontSize: 14 }}>{message}</span>
    </div>
  );
}

// Truncate ETH address
function shortAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

Object.assign(window, { StatusBadge, StarRating, Btn, Card, SectionTitle, Divider, EmptyState, shortAddr });
