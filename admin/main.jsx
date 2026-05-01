// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const { useState, useEffect } = React;
  const [mode, setMode] = useState('main'); // 'main' | 'otp' | 'password'
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [passkeySupported] = useState(() => !!(window.PublicKeyCredential && navigator.credentials));

  const ADMIN_PHONE = '••••••••'; // shown masked in UI — backend knows the real number

  // ── Passkey ──
  const handlePasskey = async () => {
    setLoading(true); setError('');
    try {
      const optRes = await fetch('https://api.krystleandco.com/api/auth/admin/passkey/login-options', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'krystle' }),
      });
      if (!optRes.ok) throw new Error('Passkey not set up yet. Use password + OTP below.');
      const options = await optRes.json();
      options.challenge = Uint8Array.from(atob(options.challenge.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map(c => ({
          ...c, id: Uint8Array.from(atob(c.id.replace(/-/g,'+').replace(/_/g,'/')), ch => ch.charCodeAt(0)),
        }));
      }
      const cred = await navigator.credentials.get({ publicKey: options });
      const verRes = await fetch('https://api.krystleandco.com/api/auth/admin/passkey/login-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cred.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(cred.rawId))),
          response: {
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array(cred.response.authenticatorData))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(cred.response.clientDataJSON))),
            signature: btoa(String.fromCharCode(...new Uint8Array(cred.response.signature))),
          },
          type: cred.type,
        }),
      });
      if (!verRes.ok) throw new Error('Passkey verification failed.');
      sessionStorage.setItem('kc_auth', '1');
      onLogin();
    } catch (e) {
      if (e.name === 'NotAllowedError') setError('Passkey cancelled.');
      else setError(e.message || 'Passkey sign-in failed.');
    }
    setLoading(false);
  };

  // ── Send OTP ──
  const sendOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('https://api.krystleandco.com/api/auth/admin/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'krystle' }),
      });
      if (!res.ok) throw new Error('Could not send OTP. Check API connection.');
      setOtpSent(true); setMode('otp');
    } catch (e) {
      setError(e.message || 'OTP send failed.');
    }
    setLoading(false);
  };

  // ── Verify OTP ──
  const verifyOtp = async () => {
    if (otp.length < 4) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('https://api.krystleandco.com/api/auth/admin/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'krystle', code: otp }),
      });
      if (!res.ok) throw new Error('Incorrect or expired code.');
      sessionStorage.setItem('kc_auth', '1');
      onLogin();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // ── Password fallback (hardcoded, local only) ──
  const handlePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    if (user === 'Krystle831' && password === 'Junior0816') {
      sessionStorage.setItem('kc_auth', '1');
      onLogin();
    } else {
      setError('Incorrect username or password.');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:UI_COLORS.bg, fontFamily:UI_COLORS.sans }}>
      <div style={{ position:'fixed', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, oklch(0.52 0.18 352 / 0.12) 0%, transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
      <div style={{ width:'100%', maxWidth:380, padding:40, background:UI_COLORS.bg2, border:`1px solid ${UI_COLORS.border}`, position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontFamily:UI_COLORS.serif, fontSize:28, marginBottom:6 }}>
            Krystle <em style={{ fontStyle:'italic', color:UI_COLORS.pink }}>&amp; Co</em>
          </div>
          <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:UI_COLORS.fgMuted }}>Admin Portal</div>
        </div>

        {error && (
          <div style={{ fontSize:12, color:UI_COLORS.red, padding:'10px 14px', background:UI_COLORS.red+'12', border:`1px solid ${UI_COLORS.red}33`, marginBottom:16 }}>{error}</div>
        )}

        {/* ── MAIN ── */}
        {mode === 'main' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {passkeySupported && (
              <button onClick={handlePasskey} disabled={loading} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                padding:'14px', background:UI_COLORS.pink, border:'none', color:UI_COLORS.bg,
                fontFamily:UI_COLORS.sans, fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase',
                cursor: loading ? 'wait' : 'pointer', transition:'all 0.2s',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {loading ? 'Verifying…' : 'Sign in with Face ID'}
              </button>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, height:1, background:UI_COLORS.border }} />
              <span style={{ fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:UI_COLORS.fgDim }}>or</span>
              <div style={{ flex:1, height:1, background:UI_COLORS.border }} />
            </div>

            <button onClick={sendOtp} disabled={loading} style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              padding:'13px', background:'transparent', border:`1px solid ${UI_COLORS.pink}55`,
              color:UI_COLORS.pink, fontFamily:UI_COLORS.sans, fontSize:11, letterSpacing:'0.15em',
              textTransform:'uppercase', cursor: loading ? 'wait' : 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .95h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              {loading ? 'Sending…' : 'Send code to my phone'}
            </button>

            <button onClick={() => setMode('password')} style={{ background:'none', border:'none', color:UI_COLORS.fgDim, fontSize:11, letterSpacing:'0.1em', cursor:'pointer', textAlign:'center', marginTop:4 }}>
              Use password instead
            </button>
          </div>
        )}

        {/* ── OTP ── */}
        {mode === 'otp' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ fontSize:13, color:UI_COLORS.fgMuted, lineHeight:1.8, textAlign:'center' }}>
              Code sent to your phone. Enter it below.
            </div>
            <input
              value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
              placeholder="000000" maxLength={6} autoFocus
              style={{ background:UI_COLORS.bg3, border:`2px solid ${otp.length===6?UI_COLORS.pink:UI_COLORS.border}`, color:UI_COLORS.fg, fontFamily:UI_COLORS.serif, fontSize:28, letterSpacing:'0.4em', padding:'14px', textAlign:'center', outline:'none', width:'100%', transition:'border-color 0.2s' }}
            />
            <button onClick={verifyOtp} disabled={loading || otp.length < 4} style={{
              padding:'13px', background: otp.length >= 4 ? UI_COLORS.pink : UI_COLORS.bg3,
              border:'none', color: otp.length >= 4 ? UI_COLORS.bg : UI_COLORS.fgMuted,
              fontFamily:UI_COLORS.sans, fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase',
              cursor: otp.length >= 4 ? 'pointer' : 'default',
            }}>{loading ? 'Verifying…' : 'Verify Code'}</button>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setMode('main'); setOtp(''); setError(''); }} style={{ flex:1, padding:'10px', background:'transparent', border:`1px solid ${UI_COLORS.border}`, color:UI_COLORS.fgMuted, fontFamily:UI_COLORS.sans, fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
              <button onClick={sendOtp} disabled={loading} style={{ flex:1, padding:'10px', background:'transparent', border:`1px solid ${UI_COLORS.border}`, color:UI_COLORS.fgMuted, fontFamily:UI_COLORS.sans, fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer' }}>Resend</button>
            </div>
          </div>
        )}

        {/* ── PASSWORD ── */}
        {mode === 'password' && (
          <form onSubmit={handlePassword} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Username">
              <Input value={user} onChange={setUser} placeholder="Username" />
            </Field>
            <Field label="Password">
              <Input value={password} onChange={v => { setPassword(v); setError(''); }} placeholder="Password" type="password" />
            </Field>
            <button type="submit" disabled={loading || !user || !password} style={{
              padding:'12px', background: UI_COLORS.pink, border:'none', color:UI_COLORS.bg,
              fontFamily:UI_COLORS.sans, fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase',
              cursor: loading || !user || !password ? 'not-allowed' : 'pointer',
              opacity: !user || !password ? 0.6 : 1,
            }}>{loading ? 'Signing in…' : 'Sign In'}</button>
            <button type="button" onClick={() => { setMode('main'); setError(''); }} style={{ background:'none', border:'none', color:UI_COLORS.fgDim, fontSize:11, cursor:'pointer', textAlign:'center' }}>
              ← Back
            </button>
          </form>
        )}
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

      <main style={{
        flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        paddingBottom: window.innerWidth < 768 ? 64 : 0,
      }}>
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