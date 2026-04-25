
// ─── Landing / Connect Wallet ─────────────────────────────────────────────────
function LandingView({ onConnect, connecting }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative",
    }}>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 520 }}>
        {/* Logo mark */}
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 64, height: 64, borderRadius: 18,
          background: T.accentDim, border: `1px solid ${T.accent}40`,
          marginBottom: 28,
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 20 C6 20 8 14 16 14 C24 14 26 20 26 20" stroke={T.accent} strokeWidth="2" strokeLinecap="round"/>
            <circle cx="10" cy="21" r="3" stroke={T.accent} strokeWidth="2"/>
            <circle cx="22" cy="21" r="3" stroke={T.accent} strokeWidth="2"/>
            <path d="M13 21 L19 21" stroke={T.accent} strokeWidth="2"/>
            <path d="M16 6 L16 10 M13 7 L16 6 L19 7" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "4px 12px", borderRadius: 100,
          background: T.accentDim, border: `1px solid ${T.accent}30`,
          color: T.accent, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.12em", textTransform: "uppercase",
          marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent }}></span>
          Decentralized · On-Chain · Trustless
        </div>

        <h1 style={{
          margin: "0 0 16px 0",
          fontSize: "clamp(36px, 6vw, 56px)",
          fontWeight: 800,
          color: T.textPrimary,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
        }}>
          Covoiturage<br />
          <span style={{ color: T.accent }}>décentralisé</span>
        </h1>

        <p style={{
          margin: "0 0 40px 0",
          fontSize: 16, color: T.textSecondary, lineHeight: 1.6,
          fontWeight: 400,
        }}>
          Partagez vos trajets directement entre conducteurs et passagers.<br />
          Paiements sécurisés par smart contract Ethereum.
        </p>

        <Btn
          variant="primary" size="lg"
          onClick={onConnect}
          loading={connecting}
          style={{ borderRadius: 12, padding: "16px 36px", fontSize: 16, gap: 10 }}
        >
          {!connecting && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 10 C14 10 13 8 10 8 C7 8 6 10 6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          )}
          {connecting ? "Connexion…" : "Connecter MetaMask"}
        </Btn>

        <p style={{ marginTop: 16, fontSize: 12, color: T.textMuted }}>
          Réseau Ethereum · Ethereum Sepolia testnet
        </p>
      </div>

      {/* Feature pills */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", gap: 12, flexWrap: "wrap",
        justifyContent: "center", marginTop: 60, maxWidth: 600,
      }}>
        {[
          { icon: "⚡", text: "Paiements instantanés" },
          { icon: "🔒", text: "Fonds en escrow" },
          { icon: "🌐", text: "Sans intermédiaire" },
          { icon: "⭐", text: "Réputation on-chain" },
        ].map(f => (
          <div key={f.text} style={{
            padding: "8px 16px", borderRadius: 100,
            background: T.bgCard, border: `1px solid ${T.border}`,
            fontSize: 13, color: T.textSecondary,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <span>{f.icon}</span>
            {f.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trips Feed (Passenger) ───────────────────────────────────────────────────
function TripsPage({ onRequest }) {
  const [trips, setTrips] = React.useState(MOCK_TRIPS);
  const [requesting, setRequesting] = React.useState(null);
  const [filter, setFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState("date");

  const filtered = trips
    .filter(t =>
      t.from.toLowerCase().includes(filter.toLowerCase()) ||
      t.to.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price") return parseFloat(a.priceEth) - parseFloat(b.priceEth);
      if (sortBy === "rating") return b.driverRating - a.driverRating;
      return (a.date + a.time).localeCompare(b.date + b.time);
    });

  const handleRequest = async (trip) => {
    setRequesting(trip.id);
    // Simulate on-chain tx
    await new Promise(r => setTimeout(r, 2000));
    setRequesting(null);
    if (onRequest) onRequest(trip);
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 28 }}>
        <SectionTitle>Trajets disponibles</SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            placeholder="Rechercher une ville…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              flex: 1, minWidth: 200,
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "10px 14px",
              color: T.textPrimary, fontSize: 14, fontFamily: "inherit",
              outline: "none",
            }}
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "10px 14px",
              color: T.textSecondary, fontSize: 13, fontFamily: "inherit",
              outline: "none",
            }}
          >
            <option value="date">Trier : Date</option>
            <option value="price">Trier : Prix</option>
            <option value="rating">Trier : Note</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" message="Aucun trajet ne correspond à votre recherche." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              onRequest={() => handleRequest(trip)}
              requesting={requesting === trip.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, onRequest, requesting }) {
  const seatsLeft = trip.seats;
  const fmtDate = new Date(trip.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Route */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, flexShrink: 0 }}></div>
            <div style={{ flex: 1, width: 1, background: T.border, margin: "4px 0" }}></div>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: T.textMuted, flexShrink: 0 }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>
              {trip.from}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.textSecondary }}>
              {trip.to}
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Meta */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <MetaChip icon="📅" text={`${fmtDate} · ${trip.time}`} />
        <MetaChip icon="💺" text={`${seatsLeft} place${seatsLeft > 1 ? "s" : ""}`} accent={seatsLeft <= 1} />
        <MetaChip icon="🚗" text={trip.carModel} />
      </div>

      {/* Driver + Price */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 2 }}>Conducteur</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{trip.driverName}</div>
          <StarRating rating={trip.driverRating} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.accent, letterSpacing: "-0.02em" }}>
            {trip.priceEth} <span style={{ fontSize: 13, fontWeight: 600 }}>ETH</span>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>par siège</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Btn
          variant="primary" size="md"
          onClick={onRequest}
          loading={requesting}
          disabled={seatsLeft === 0}
          style={{ width: "100%", borderRadius: 8 }}
        >
          {seatsLeft === 0 ? "Complet" : requesting ? "Envoi de la transaction…" : "Demander une place"}
        </Btn>
      </div>
    </Card>
  );
}

function MetaChip({ icon, text, accent }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 6,
      background: accent ? T.amberDim : T.bgElevated,
      color: accent ? T.amber : T.textSecondary,
      fontSize: 12, fontWeight: 500,
    }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      {text}
    </span>
  );
}

// ─── My Reservations (Passenger) ─────────────────────────────────────────────
function MyReservationsView() {
  const [reservations, setReservations] = React.useState(MOCK_MY_RESERVATIONS);
  const [cancelling, setCancelling] = React.useState(null);

  const handleCancel = async (resId) => {
    setCancelling(resId);
    await new Promise(r => setTimeout(r, 1800));
    setReservations(prev =>
      prev.map(r => r.id === resId ? { ...r, status: "ANNULEE_PASSAGER" } : r)
    );
    setCancelling(null);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <SectionTitle>Mes réservations</SectionTitle>

      {reservations.length === 0 ? (
        <EmptyState icon="🎫" message="Vous n'avez aucune réservation pour le moment." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reservations.map(res => (
            <ReservationRow
              key={res.id}
              reservation={res}
              onCancel={() => handleCancel(res.id)}
              cancelling={cancelling === res.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationRow({ reservation: res, onCancel, cancelling }) {
  const canCancel = res.status === "EN_ATTENTE" || res.status === "ACCEPTEE";
  const fmtDate = new Date(res.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <StatusBadge status={res.status} />
            <span style={{ fontSize: 12, color: T.textMuted }}>{res.id}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 2 }}>
            {res.from} → {res.to}
          </div>
          <div style={{ fontSize: 13, color: T.textSecondary }}>
            {fmtDate} · {res.time} · {res.driverName}
          </div>
          <div style={{ marginTop: 4 }}>
            <StarRating rating={res.driverRating} />
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.accent }}>
            {res.priceEth} ETH
          </div>
          {canCancel && (
            <Btn
              variant="danger" size="sm"
              onClick={onCancel}
              loading={cancelling}
              style={{ marginTop: 8, borderRadius: 6 }}
            >
              {cancelling ? "Annulation…" : "Annuler"}
            </Btn>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Post a Trip (Driver) ─────────────────────────────────────────────────────
function PostTripView() {
  const [form, setForm] = React.useState({
    from: "", to: "", date: "", time: "",
    priceEth: "", seats: 2,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    const e = {};
    if (!form.from.trim()) e.from = "Champ requis";
    if (!form.to.trim()) e.to = "Champ requis";
    if (!form.date) e.date = "Champ requis";
    if (!form.time) e.time = "Champ requis";
    if (!form.priceEth || isNaN(parseFloat(form.priceEth)) || parseFloat(form.priceEth) <= 0)
      e.priceEth = "Prix invalide";
    if (!form.seats || form.seats < 1 || form.seats > 8)
      e.seats = "Entre 1 et 8 places";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2200));
    setSubmitting(false);
    setSuccess(true);
    setForm({ from: "", to: "", date: "", time: "", priceEth: "", seats: 2 });
  };

  const Field = ({ label, id, children, error }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: T.red }}>{error}</span>}
    </div>
  );

  const inputStyle = (err) => ({
    background: T.bgCard, border: `1px solid ${err ? T.red : T.border}`,
    borderRadius: 8, padding: "11px 14px",
    color: T.textPrimary, fontSize: 14, fontFamily: "inherit",
    outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

  if (success) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px", textAlign: "center" }}>
        <div style={{ marginBottom: 32, marginTop: 60 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: T.greenDim, border: `1px solid ${T.green}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 32,
          }}>✓</div>
          <h2 style={{ color: T.textPrimary, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Annonce publiée !
          </h2>
          <p style={{ color: T.textSecondary, fontSize: 15 }}>
            Votre trajet est maintenant visible par les passagers.<br />
            Les demandes de réservation apparaîtront dans "Mes Trajets".
          </p>
        </div>
        <Btn variant="outline" size="md" onClick={() => setSuccess(false)} style={{ borderRadius: 8 }}>
          Publier un autre trajet
        </Btn>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
      <SectionTitle>Publier un trajet</SectionTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Départ" error={errors.from}>
            <input
              style={inputStyle(errors.from)}
              placeholder="Ville de départ"
              value={form.from}
              onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
            />
          </Field>
          <Field label="Arrivée" error={errors.to}>
            <input
              style={inputStyle(errors.to)}
              placeholder="Ville d'arrivée"
              value={form.to}
              onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Date" error={errors.date}>
            <input
              type="date"
              style={inputStyle(errors.date)}
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </Field>
          <Field label="Heure" error={errors.time}>
            <input
              type="time"
              style={inputStyle(errors.time)}
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Prix par siège (ETH)" error={errors.priceEth}>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle(errors.priceEth), paddingRight: 42 }}
                placeholder="0.010"
                value={form.priceEth}
                onChange={e => setForm(f => ({ ...f, priceEth: e.target.value }))}
              />
              <span style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 12, fontWeight: 700, color: T.accent,
              }}>ETH</span>
            </div>
          </Field>
          <Field label="Nombre de places" error={errors.seats}>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, seats: n }))}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                    background: form.seats === n ? T.accent : T.bgElevated,
                    color: form.seats === n ? "#0a1a14" : T.textSecondary,
                    fontFamily: "inherit", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >{n}</button>
              ))}
            </div>
          </Field>
        </div>

        {/* Summary */}
        {form.from && form.to && form.priceEth && (
          <div style={{
            padding: 16, borderRadius: 10,
            background: T.accentDim, border: `1px solid ${T.accent}30`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>
                {form.from} → {form.to}
              </div>
              <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
                {form.seats} siège{form.seats > 1 ? "s" : ""} · {form.date} {form.time}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.accent }}>
              {form.priceEth} ETH
            </div>
          </div>
        )}

        <Btn
          variant="primary" size="lg"
          onClick={handleSubmit}
          loading={submitting}
          style={{ borderRadius: 10, marginTop: 4 }}
        >
          {submitting ? "Transaction en cours…" : "Publier le trajet"}
        </Btn>
      </div>
    </div>
  );
}

// ─── My Trips (Driver) ────────────────────────────────────────────────────────
function MyTripsView() {
  const [trips, setTrips] = React.useState(MOCK_MY_TRIPS);
  const [expanded, setExpanded] = React.useState("0xA1");
  const [txPending, setTxPending] = React.useState(null); // "tripId:action:resId?"

  const withTx = async (key, fn) => {
    setTxPending(key);
    await new Promise(r => setTimeout(r, 1800));
    fn();
    setTxPending(null);
  };

  const acceptRes = (tripId, resId) =>
    withTx(`${tripId}:accept:${resId}`, () =>
      setTrips(ts => ts.map(t => t.id !== tripId ? t : {
        ...t,
        reservations: t.reservations.map(r => r.id === resId ? { ...r, status: "ACCEPTEE" } : r)
      }))
    );

  const refuseRes = (tripId, resId) =>
    withTx(`${tripId}:refuse:${resId}`, () =>
      setTrips(ts => ts.map(t => t.id !== tripId ? t : {
        ...t,
        reservations: t.reservations.map(r => r.id === resId ? { ...r, status: "REFUSEE_CONDUCTEUR" } : r)
      }))
    );

  const confirmDeparture = (tripId) =>
    withTx(`${tripId}:depart`, () =>
      setTrips(ts => ts.map(t => t.id === tripId ? { ...t, status: "COMPLETE" } : t))
    );

  const completeTrip = (tripId) =>
    withTx(`${tripId}:complete`, () =>
      setTrips(ts => ts.map(t => t.id === tripId ? { ...t, status: "TERMINEE" } : t))
    );

  const cancelTrip = (tripId) =>
    withTx(`${tripId}:cancel`, () =>
      setTrips(ts => ts.map(t => t.id === tripId ? { ...t, status: "ANNULEE" } : t))
    );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <SectionTitle>Mes trajets</SectionTitle>

      {trips.length === 0 ? (
        <EmptyState icon="🚗" message="Vous n'avez publié aucun trajet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {trips.map(trip => (
            <DriverTripCard
              key={trip.id}
              trip={trip}
              expanded={expanded === trip.id}
              onToggle={() => setExpanded(expanded === trip.id ? null : trip.id)}
              txPending={txPending}
              onAccept={(resId) => acceptRes(trip.id, resId)}
              onRefuse={(resId) => refuseRes(trip.id, resId)}
              onConfirmDeparture={() => confirmDeparture(trip.id)}
              onCompleteTrip={() => completeTrip(trip.id)}
              onCancelTrip={() => cancelTrip(trip.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DriverTripCard({
  trip, expanded, onToggle, txPending,
  onAccept, onRefuse, onConfirmDeparture, onCompleteTrip, onCancelTrip,
}) {
  const fmtDate = new Date(trip.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const pendingCount = trip.reservations.filter(r => r.status === "EN_ATTENTE").length;

  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.borderFaint}`,
      borderRadius: 14, overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          padding: "18px 20px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 14,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <StatusBadge status={trip.status} />
            {pendingCount > 0 && (
              <span style={{
                background: T.amberDim, color: T.amber,
                border: `1px solid ${T.amber}40`,
                fontSize: 11, fontWeight: 700,
                padding: "2px 8px", borderRadius: 100,
              }}>
                {pendingCount} en attente
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>
            {trip.from} → {trip.to}
          </div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 3 }}>
            {fmtDate} · {trip.time} · {trip.priceEth} ETH/siège · {trip.seatsTotal} places
          </div>
        </div>
        <span style={{
          fontSize: 18, color: T.textMuted,
          transform: expanded ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
        }}>↓</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.borderFaint}`, padding: "0 20px 20px" }}>
          {/* Reservations */}
          <div style={{ paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
              Réservations ({trip.reservations.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {trip.reservations.map(res => {
                const isAccepting = txPending === `${trip.id}:accept:${res.id}`;
                const isRefusing = txPending === `${trip.id}:refuse:${res.id}`;
                return (
                  <div key={res.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 10,
                    background: T.bgElevated, border: `1px solid ${T.borderFaint}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: T.accentDim, border: `1px solid ${T.accent}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, color: T.accent, flexShrink: 0,
                    }}>
                      {res.passengerName.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{res.passengerName}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{shortAddr(res.passenger)}</div>
                    </div>
                    <StatusBadge status={res.status} />
                    {res.status === "EN_ATTENTE" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn variant="primary" size="sm" onClick={() => onAccept(res.id)} loading={isAccepting} style={{ borderRadius: 6 }}>
                          {isAccepting ? "…" : "Accepter"}
                        </Btn>
                        <Btn variant="danger" size="sm" onClick={() => onRefuse(res.id)} loading={isRefusing} style={{ borderRadius: 6 }}>
                          {isRefusing ? "…" : "Refuser"}
                        </Btn>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trip actions */}
          {trip.status !== "TERMINEE" && trip.status !== "ANNULEE" && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 8, borderTop: `1px solid ${T.borderFaint}` }}>
              {trip.status === "PUBLIEE" && (
                <Btn
                  variant="primary" size="sm"
                  onClick={onConfirmDeparture}
                  loading={txPending === `${trip.id}:depart`}
                  style={{ borderRadius: 8 }}
                >
                  Confirmer le départ
                </Btn>
              )}
              {trip.status === "COMPLETE" && (
                <Btn
                  variant="outline" size="sm"
                  onClick={onCompleteTrip}
                  loading={txPending === `${trip.id}:complete`}
                  style={{ borderRadius: 8 }}
                >
                  Marquer terminé
                </Btn>
              )}
              {trip.status === "PUBLIEE" && (
                <Btn
                  variant="danger" size="sm"
                  onClick={onCancelTrip}
                  loading={txPending === `${trip.id}:cancel`}
                  style={{ borderRadius: 8 }}
                >
                  Annuler l'annonce
                </Btn>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  LandingView, TripsPage, MyReservationsView,
  PostTripView, MyTripsView,
});
