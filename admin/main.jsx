// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const { useState } = React;
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    if (user === 'KRYJOH83' && pass === '143olivia') {
      sessionStorage.setItem('kc_auth', '1');
      onLogin();
    } else {
      setError('Incorrect username or password.');
      setPass('');
    }
    setLoading(false);
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: UI_COLORS.bg, fontFamily: UI_COLORS.sans,
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, oklch(0.52 0.18 352 / 0.12) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none',
      }} />
      <div style={{
        width: '100%', maxWidth: 380, padding: 40,
        background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`,
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: UI_COLORS.serif, fontSize: 28, marginBottom: 6 }}>
            Krystle <em style={{ fontStyle: 'italic', color: UI_COLORS.pink }}>&amp; Co</em>
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: UI_COLORS.fgMuted }}>
            Admin Portal
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Username">
            <Input value={user} onChange={setUser} placeholder="Username" />
          </Field>
          <Field label="Password">
            <Input value={pass} onChange={v => { setPass(v); setError(''); }} placeholder="Password" type="password" />
          </Field>
          {error && (
            <div style={{ fontSize: 12, color: UI_COLORS.red, padding: '8px 12px', background: UI_COLORS.red + '12', border: `1px solid ${UI_COLORS.red}33` }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading || !user || !pass} style={{
            marginTop: 8, padding: '12px', background: loading ? UI_COLORS.pinkDeep : UI_COLORS.pink,
            border: 'none', color: UI_COLORS.bg, fontFamily: UI_COLORS.sans,
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: loading || !user || !pass ? 'not-allowed' : 'pointer',
            opacity: !user || !pass ? 0.6 : 1, transition: 'all 0.2s',
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main App — wires everything together ─────────────────────────────────────
function App() {
  const { useState, useCallback } = React;
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('kc_auth') === '1');

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const [view, setView] = useState('dashboard');
  const [data, setData] = useState(() => Store.get());
  const [apptModal, setApptModal] = useState({ open: false, appt: null });

  const refresh = useCallback(() => setData(Store.get()), []);

  const openNewAppt = (defaults = {}) => {
    setApptModal({ open: true, appt: { ...defaults } });
  };
  const openEditAppt = (appt) => {
    setApptModal({ open: true, appt });
  };
  const closeApptModal = () => setApptModal({ open: false, appt: null });

  const goToClient = (clientId) => {
    closeApptModal();
    setView('clients');
    // Store the target client id so ClientsView can auto-select it
    window.__pendingClientId = clientId;
  };

  const saveAppt = (appt) => {
    Store.appointments.save(appt);
    refresh();
  };
  const deleteAppt = (id) => {
    Store.appointments.delete(id);
    refresh();
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: UI_COLORS.bg, color: UI_COLORS.fg,
      fontFamily: UI_COLORS.sans, fontWeight: 300,
      WebkitFontSmoothing: 'antialiased',
    }}>
      <Sidebar view={view} setView={setView} />

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'dashboard' && (
          <Dashboard
            data={data}
            onNewAppt={openNewAppt}
            onViewAppt={openEditAppt}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            data={data}
            onNewAppt={openNewAppt}
            onViewAppt={openEditAppt}
          />
        )}
        {view === 'clients' && (
          <ClientsView
            data={data}
            refresh={refresh}
            onNewAppt={openNewAppt}
          />
        )}
        {view === 'pricing' && (
          <PricingView data={data} refresh={refresh} />
        )}
        {view === 'messages' && (
          <MessagesView data={data} refresh={refresh} />
        )}
        {view === 'finance' && (
          <FinanceView data={data} />
        )}
        {view === 'gallery' && (
          <GalleryView data={data} refresh={refresh} />
        )}
        {view === 'waivers' && (
          <WaiversView data={data} refresh={refresh} />
        )}
        {view === 'stripe' && (
          <StripeView data={data} refresh={refresh} />
        )}
      </main>

      <AppointmentModal
        open={apptModal.open}
        onClose={closeApptModal}
        appt={apptModal.appt}
        clients={data.clients}
        services={data.services}
        onSave={saveAppt}
        onDelete={deleteAppt}
        onGoToClient={goToClient}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
