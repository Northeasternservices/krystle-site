// Krystle & Co — Shared UI Components
// Exports: Sidebar, Modal, Avatar, Badge, Btn, Field, Select, AppointmentModal

const UI_COLORS = {
  bg: '#0d0b0c',
  bg2: '#161213',
  bg3: '#1e1a1c',
  surface: '#231f21',
  border: 'rgba(255,255,255,0.08)',
  pink: 'oklch(0.72 0.14 352)',
  pinkDeep: 'oklch(0.52 0.18 352)',
  green: 'oklch(0.72 0.16 145)',
  yellow: 'oklch(0.82 0.15 85)',
  red: 'oklch(0.65 0.18 25)',
  fg: '#f0ece8',
  fgMuted: 'rgba(240,236,232,0.5)',
  fgDim: 'rgba(240,236,232,0.25)',
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Jost', sans-serif",
};
window.UI_COLORS = UI_COLORS;

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, photo = null }) {
  if (photo) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?';
  const colors = ['oklch(0.72 0.14 352)','oklch(0.65 0.16 200)','oklch(0.70 0.14 145)','oklch(0.75 0.12 280)','oklch(0.72 0.15 30)'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 500, color,
      flexShrink: 0, fontFamily: UI_COLORS.sans, letterSpacing: '0.05em',
    }}>{initials}</div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    confirmed: { label: 'Confirmed', color: UI_COLORS.green },
    pending:   { label: 'Pending',   color: UI_COLORS.yellow },
    completed: { label: 'Done',      color: UI_COLORS.fgMuted },
    cancelled: { label: 'Cancelled', color: UI_COLORS.red },
  };
  const { label, color } = map[status] || { label: status, color: UI_COLORS.fgMuted };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 10px', borderRadius: 20,
      background: color + '18', border: `1px solid ${color}44`,
      fontSize: 11, letterSpacing: '0.1em', color, fontFamily: UI_COLORS.sans,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', size = 'md', style = {}, disabled }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: UI_COLORS.sans, fontWeight: 400, letterSpacing: '0.12em',
    textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'all 0.2s', opacity: disabled ? 0.5 : 1,
    fontSize: size === 'sm' ? 10 : 11,
    padding: size === 'sm' ? '6px 14px' : '10px 22px',
  };
  const variants = {
    primary: { background: UI_COLORS.pink, color: UI_COLORS.bg },
    ghost: { background: 'transparent', color: UI_COLORS.fg, border: `1px solid ${UI_COLORS.border}` },
    danger: { background: UI_COLORS.red + '22', color: UI_COLORS.red, border: `1px solid ${UI_COLORS.red}44` },
    success: { background: UI_COLORS.green + '22', color: UI_COLORS.green, border: `1px solid ${UI_COLORS.green}44` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <label style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.fgMuted }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', style = {} }) {
  return (
    <input
      type={type} value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`,
        color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 14, fontWeight: 300,
        padding: '9px 12px', outline: 'none', width: '100%', ...style,
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{
        background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`,
        color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 14, fontWeight: 300,
        padding: '9px 12px', outline: 'none', width: '100%', resize: 'vertical',
      }}
    />
  );
}

function SelectInput({ value, onChange, options, style = {} }) {
  return (
    <select
      value={value || ''} onChange={e => onChange(e.target.value)}
      style={{
        background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`,
        color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 14, fontWeight: 300,
        padding: '9px 12px', outline: 'none', width: '100%', cursor: 'pointer', ...style,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`,
        width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${UI_COLORS.border}`,
          position: 'sticky', top: 0, background: UI_COLORS.bg2, zIndex: 1,
        }}>
          <span style={{ fontFamily: UI_COLORS.serif, fontSize: 22, fontWeight: 300 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: UI_COLORS.fgMuted, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── AppointmentModal ─────────────────────────────────────────────────────────
function AppointmentModal({ open, onClose, appt, clients, services, onSave, onDelete, onGoToClient }) {
  const { useState, useEffect } = React;
  const blank = { clientId: '', service: '', date: DateUtil.today(), time: '10:00', duration: 60, price: '', status: 'confirmed', notes: '' };
  const [form, setForm] = useState(blank);
  const [clientMode, setClientMode] = useState('existing'); // 'existing' | 'new'
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDrop, setShowClientDrop] = useState(false);

  useEffect(() => {
    setForm(appt ? { ...appt } : blank);
    setClientMode('existing');
    setNewClient({ name: '', phone: '', email: '' });
    const existing = appt?.clientId ? clients.find(c => c.id === appt.clientId) : null;
    setClientSearch(existing ? existing.name : '');
    setShowClientDrop(false);
    setStripeLink('');
    setStripeLinkError('');
    // Sync calendar month to appointment date
    if (appt?.date) {
      const d = new Date(appt.date + 'T12:00:00');
      setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
    } else {
      const d = new Date();
      setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [appt, open]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-appt-client]')) setShowClientDrop(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNC = (k, v) => setNewClient(f => ({ ...f, [k]: v }));

  const handleServiceChange = (name) => {
    const svc = services.find(s => s.name === name);
    set('service', name);
    if (svc) { set('duration', svc.duration); set('price', svc.price); }
  };

  const handleSave = () => {
    if (clientMode === 'existing' && (!form.clientId || !form.service || !form.date)) return;
    if (clientMode === 'new' && (!newClient.name || !form.service || !form.date)) return;
    // Ensure time has a default
    const finalForm = { ...form, time: form.time || '10:00' };
    if (clientMode === 'new') {
      onSave({ ...finalForm, clientId: '', clientName: newClient.name, clientPhone: newClient.phone, clientEmail: newClient.email });
    } else {
      onSave(finalForm);
    }
    onClose();
  };

  const filteredClients = clientSearch.length > 0
    ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone || '').includes(clientSearch) || (c.email || '').toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

  const selectedClient = form.clientId ? clients.find(c => c.id === form.clientId) : null;

  const serviceOpts = [{ value: '', label: 'Select service…' }, ...services.map(s => ({ value: s.name, label: `${s.name} — $${s.price}` }))];
  const statusOpts = ['confirmed','pending','completed','cancelled'].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));

  // Generate dynamic Stripe link for this appointment
  const [stripeLink, setStripeLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);

  const [stripeLinkError, setStripeLinkError] = useState('');

  const generateStripeLink = async (type = 'deposit') => {
    if (!form.clientId || !form.service) return;
    setGeneratingLink(true);
    setStripeLink('');
    setStripeLinkError('');

    // Auto-save the appointment first so it has a real ID
    let apptId = form.id;
    if (!apptId) {
      Store.appointments.save(form);
      const saved = Store.appointments.all().find(a =>
        a.clientId === form.clientId && a.date === form.date && a.time === form.time && a.service === form.service
      );
      apptId = saved?.id || '';
      if (apptId) setForm(f => ({ ...f, id: apptId }));
    }

    const svc = services.find(s => s.name === form.service);
    const depositAmt = Math.round((Number(form.price) || 0) * 0.5);
    const amt = type === 'deposit' ? depositAmt : Number(form.price);
    try {
      const res = await fetch('https://api.krystleandco.com/api/stripe/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: svc?.id,
          serviceName: form.service,
          amount: amt,
          type,
          appointmentId: apptId,
          clientId: form.clientId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStripeLink(data.url || data.link || '');
        if (!data.url && !data.link) setStripeLinkError('API responded but returned no link. Check the response format.');
      } else {
        const text = await res.text();
        setStripeLinkError(`API error ${res.status}: ${text.slice(0, 120)}`);
      }
    } catch (e) {
      setStripeLinkError(`Could not reach API: ${e.message}`);
    }
    setGeneratingLink(false);
  };

  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const refreshApptStatus = async () => {
    if (!form.id) return;
    try {
      const res = await fetch(`https://api.krystleandco.com/api/appointments/${form.id}`);
      if (res.ok) {
        const fresh = await res.json();
        setForm(f => ({
          ...f,
          paymentStatus: fresh.paymentStatus,
          status: fresh.status || f.status,
          balanceDue: fresh.balanceDue,
          depositAmount: fresh.depositAmount,
        }));
        alert(`✓ Refreshed! Payment: ${fresh.paymentStatus} · Deposit: $${fresh.depositAmount} · Balance: $${fresh.balanceDue}`);
        return;
      } else {
        alert(`API error ${res.status} for appointment ${form.id}`);
      }
    } catch (e) {
      alert(`Could not reach API: ${e.message}`);
    }
    // Fallback to localStorage
    const data = Store.get();
    const fresh = data.appointments.find(a => a.id === form.id);
    if (fresh) setForm(f => ({ ...f, paymentStatus: fresh.paymentStatus, status: fresh.status, balanceDue: fresh.balanceDue }));
  };

  const canSave = clientMode === 'existing'
    ? (form.clientId && form.service && form.date)
    : (newClient.name.trim() && form.service && form.date);

  return (
    <Modal open={open} onClose={onClose} title={appt?.id ? 'Edit Appointment' : 'New Appointment'} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Client selector */}
        <Field label="Client">
          {/* Toggle existing / new */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
            {['existing','new'].map((mode, i) => (
              <button key={mode} onClick={() => { setClientMode(mode); if (mode === 'existing') setNewClient({ name:'', phone:'', email:'' }); else { set('clientId',''); setClientSearch(''); } }}
                style={{
                  flex: 1, padding: '7px 0', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                  background: clientMode === mode ? UI_COLORS.pink + '22' : UI_COLORS.bg3,
                  border: `1px solid ${clientMode === mode ? UI_COLORS.pink + '55' : UI_COLORS.border}`,
                  borderLeft: i === 1 ? 'none' : undefined,
                  color: clientMode === mode ? UI_COLORS.pink : UI_COLORS.fgMuted,
                  cursor: 'pointer',
                }}>
                {mode === 'existing' ? 'Existing Client' : '+ New Client'}
              </button>
            ))}
          </div>

          {clientMode === 'existing' ? (
            <div style={{ position: 'relative' }} data-appt-client="1">
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClientDrop(true); if (!e.target.value) { set('clientId',''); } }}
                  onFocus={() => setShowClientDrop(true)}
                  placeholder="Search by name, phone or email…"
                  style={{ flex: 1, background: UI_COLORS.bg3, border: `1px solid ${form.clientId ? UI_COLORS.pink+'55' : UI_COLORS.border}`, color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 13, fontWeight: 300, padding: '9px 12px', outline: 'none' }}
                />
                {form.clientId && (
                  <button onClick={() => { set('clientId',''); setClientSearch(''); }} style={{ background:'transparent', border:`1px solid ${UI_COLORS.border}`, color: UI_COLORS.fgMuted, cursor:'pointer', padding:'0 10px', fontSize:13 }}>✕</button>
                )}
              </div>
              {showClientDrop && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:200, background: UI_COLORS.bg2, border:`1px solid ${UI_COLORS.border}`, maxHeight:220, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                  {filteredClients.length === 0 && (
                    <div style={{ padding:'12px 14px', fontSize:12, color: UI_COLORS.fgMuted }}>No clients found</div>
                  )}
                  {filteredClients.map(c => (
                    <div key={c.id} onClick={() => { set('clientId', c.id); setClientSearch(c.name); setShowClientDrop(false); }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', fontSize:13, cursor:'pointer', background: form.clientId===c.id ? UI_COLORS.pink+'18' : 'transparent', color: form.clientId===c.id ? UI_COLORS.pink : UI_COLORS.fg }}
                      onMouseEnter={e => { if(form.clientId!==c.id) e.currentTarget.style.background=UI_COLORS.bg3; }}
                      onMouseLeave={e => { if(form.clientId!==c.id) e.currentTarget.style.background='transparent'; }}>
                      <Avatar name={c.name} size={28} photo={c.profilePhoto} />
                      <div>
                        <div style={{ fontWeight:400 }}>{c.name}</div>
                        {c.phone && <div style={{ fontSize:11, color: UI_COLORS.fgMuted }}>{c.phone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedClient && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, padding:'10px 12px', background: UI_COLORS.bg3, border:`1px solid ${UI_COLORS.pink}22` }}>
                  <Avatar name={selectedClient.name} size={32} photo={selectedClient.profilePhoto} />
                  <div style={{ flex:1 }}>
                    <button onClick={() => { onClose(); onGoToClient && onGoToClient(selectedClient.id); }}
                      style={{ background:'none', border:'none', padding:0, fontSize:13, color:UI_COLORS.pink, cursor:'pointer', textDecoration:'underline', fontFamily:UI_COLORS.sans, fontWeight:400 }}>
                      {selectedClient.name} →
                    </button>
                    <div style={{ fontSize:11, color: UI_COLORS.fgMuted }}>{selectedClient.phone} {selectedClient.email && `· ${selectedClient.email}`}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <div style={{ fontSize:12, color: UI_COLORS.green }}>${selectedClient.totalSpent || 0} lifetime</div>
                    {(() => {
                      const w = Store.waivers.forClient(selectedClient.id);
                      return w
                        ? <div style={{ fontSize:10, color:UI_COLORS.green }}>✓ Waiver signed</div>
                        : <div style={{ fontSize:10, color:UI_COLORS.red }}>⚠ No waiver</div>;
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'14px', background: UI_COLORS.bg3, border:`1px solid ${UI_COLORS.border}` }}>
              <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color: UI_COLORS.pink, marginBottom:2 }}>New Client Details</div>
              <Field label="Full Name *"><Input value={newClient.name} onChange={v => setNC('name',v)} placeholder="First Last" /></Field>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Field label="Phone"><Input value={newClient.phone} onChange={v => setNC('phone',v)} type="tel" placeholder="555-000-0000" /></Field>
                <Field label="Email"><Input value={newClient.email} onChange={v => setNC('email',v)} type="email" placeholder="email@example.com" /></Field>
              </div>
              <div style={{ fontSize:11, color: UI_COLORS.fgMuted }}>A full client profile will be created on save.</div>
            </div>
          )}
        </Field>
        {/* Allergy Alert */}
        {(() => {
          const client = form.clientId ? clients.find(c => c.id === form.clientId) : null;
          if (!client) return null;
          const waiver = Store.waivers.forClient(client.id);
          const flags = [];
          if (client.allergies && client.allergies.toLowerCase() !== 'none' && client.allergies.toLowerCase() !== 'none known') flags.push(client.allergies);
          if (waiver?.latexAllergy) flags.push('Latex allergy');
          if (waiver?.adhesiveAllergy) flags.push('Adhesive / cyanoacrylate allergy');
          if (waiver?.formaldehydeAllergy) flags.push('Formaldehyde sensitivity');
          if (waiver?.otherAllergies) flags.push(waiver.otherAllergies);
          if (flags.length === 0) return null;
          return (
            <div style={{ background: UI_COLORS.red + '14', border: `1px solid ${UI_COLORS.red}44`, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
              <div>
                <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: UI_COLORS.red, marginBottom: 4 }}>Allergy Alert — {client.name}</div>
                <div style={{ fontSize: 13, color: UI_COLORS.fg, lineHeight: 1.6 }}>{flags.join(' · ')}</div>
              </div>
            </div>
          );
        })()}

        {/* Payment status banner */}
        {form.paymentStatus === 'deposit_paid' && (
          <div style={{ background: UI_COLORS.green+'12', border:`1px solid ${UI_COLORS.green}44`, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>✓</span>
              <div>
                <div style={{ fontSize:13, color:UI_COLORS.green, fontWeight:400 }}>Deposit Received</div>
                <div style={{ fontSize:11, color:UI_COLORS.fgMuted }}>Balance due at appointment: <strong style={{color:UI_COLORS.fg}}>${form.balanceDue || (Number(form.price) - (form.depositAmount||0))}</strong></div>
              </div>
            </div>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:UI_COLORS.green, border:`1px solid ${UI_COLORS.green}44`, padding:'4px 10px' }}>Stripe ✓</div>
          </div>
        )}
        {form.paymentStatus === 'paid_full' && (
          <div style={{ background: UI_COLORS.green+'18', border:`1px solid ${UI_COLORS.green}55`, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>✓</span>
            <div style={{ fontSize:13, color:UI_COLORS.green, fontWeight:400 }}>Paid in Full — ${form.price}</div>
          </div>
        )}
        {form.paymentStatus === 'deposit_pending' && (
          <div style={{ background: UI_COLORS.yellow+'10', border:`1px solid ${UI_COLORS.yellow}33`, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:14 }}>⏳</span>
            <div style={{ fontSize:13, color:UI_COLORS.yellow }}>Deposit link sent — awaiting payment</div>
          </div>
        )}

        <Field label="Service">
          <SelectInput value={form.service} onChange={handleServiceChange} options={serviceOpts} />
        </Field>
        {/* Custom Date + Time picker */}
        <Field label="Date & Time">
          {(() => {
            const { year, month } = calMonth;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDay = (() => { const fd = new Date(year, month, 1).getDay(); return fd === 0 ? 6 : fd - 1; })();
            const cells = [];
            for (let i = 0; i < firstDay; i++) cells.push(null);
            for (let i = 1; i <= daysInMonth; i++) cells.push(i);
            const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            const prevMonth = () => { const nd = new Date(year, month - 1, 1); setCalMonth({ year: nd.getFullYear(), month: nd.getMonth() }); };
            const nextMonth = () => { const nd = new Date(year, month + 1, 1); setCalMonth({ year: nd.getFullYear(), month: nd.getMonth() }); };

            const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];
            const HOURS = Array.from({length:11},(_,i)=>i+8);

            return (
              <div>
                {/* Month nav */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <button onClick={prevMonth} style={{ background:'none', border:`1px solid ${UI_COLORS.border}`, color:UI_COLORS.fg, cursor:'pointer', padding:'4px 10px', fontSize:14 }}>‹</button>
                  <span style={{ fontFamily:UI_COLORS.serif, fontSize:16 }}>{monthLabel}</span>
                  <button onClick={nextMonth} style={{ background:'none', border:`1px solid ${UI_COLORS.border}`, color:UI_COLORS.fg, cursor:'pointer', padding:'4px 10px', fontSize:14 }}>›</button>
                </div>
                {/* Calendar grid */}
                <div style={{ background:UI_COLORS.bg3, border:`1px solid ${UI_COLORS.border}`, marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:`1px solid ${UI_COLORS.border}` }}>
                    {DAYS.map(d => <div key={d} style={{ padding:'6px 0', textAlign:'center', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:UI_COLORS.fgMuted }}>{d}</div>)}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
                    {cells.map((day, i) => {
                      if (!day) return <div key={`e${i}`} style={{ minHeight:36 }} />;
                      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const isPast = dateStr < DateUtil.today();
                      const isBlocked = Store.availability.isDateBlocked(dateStr);
                      const isSelected = dateStr === form.date;
                      const isToday = DateUtil.isToday(dateStr);
                      const disabled = isPast || isBlocked;
                      return (
                        <div key={day} onClick={() => !disabled && set('date', dateStr)}
                          style={{
                            minHeight:36, display:'flex', alignItems:'center', justifyContent:'center',
                            cursor: disabled ? 'default' : 'pointer',
                            background: isSelected ? UI_COLORS.pink : isBlocked ? UI_COLORS.red+'11' : 'transparent',
                            opacity: disabled ? 0.35 : 1,
                            position:'relative',
                          }}>
                          <div style={{
                            width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                            background: isSelected ? UI_COLORS.pink : isToday ? UI_COLORS.pink+'33' : 'transparent',
                            color: isSelected ? UI_COLORS.bg : UI_COLORS.fg, fontSize:12,
                          }}>{day}</div>
                          {isBlocked && !isPast && <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:UI_COLORS.red }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Time slots */}
                {form.date && (
                  <div>
                    <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:UI_COLORS.fgMuted, marginBottom:6 }}>Time — {DateUtil.format(form.date,'medium')}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {HOURS.map(h => {
                        const timeStr = `${String(h).padStart(2,'0')}:00`;
                        const blocked = Store.availability.isTimeBlocked(form.date, timeStr);
                        const selected = form.time === timeStr;
                        return (
                          <button key={h} disabled={blocked} onClick={() => !blocked && set('time', timeStr)}
                            style={{
                              padding:'6px 12px', fontSize:11, cursor: blocked ? 'default' : 'pointer',
                              background: selected ? UI_COLORS.pink : blocked ? UI_COLORS.bg3 : 'transparent',
                              border:`1px solid ${selected ? UI_COLORS.pink : blocked ? UI_COLORS.border : UI_COLORS.border}`,
                              color: selected ? UI_COLORS.bg : blocked ? UI_COLORS.fgDim : UI_COLORS.fg,
                              textDecoration: blocked ? 'line-through' : 'none',
                            }}>
                            {DateUtil.formatTime(timeStr)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Duration (min)"><Input type="number" value={form.duration} onChange={v => set('duration', Number(v))} /></Field>
          <Field label="Price ($)"><Input type="number" value={form.price} onChange={v => set('price', Number(v))} /></Field>
        </div>
        <Field label="Status">
          <SelectInput value={form.status} onChange={v => set('status', v)} options={statusOpts} />
        </Field>
        <Field label="Payment Status">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <SelectInput value={form.paymentStatus || 'unpaid'} onChange={v => set('paymentStatus', v)} options={[
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'deposit_pending', label: 'Deposit Pending' },
                { value: 'deposit_paid', label: 'Deposit Paid' },
                { value: 'paid_full', label: 'Paid in Full' },
              ]} />
            </div>
            {form.id && (
              <button onClick={refreshApptStatus} title="Refresh payment status from server"
                style={{ padding: '9px 12px', background: 'transparent', border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fgMuted, cursor: 'pointer', fontSize: 14, flexShrink: 0, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = UI_COLORS.pink; e.currentTarget.style.color = UI_COLORS.pink; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = UI_COLORS.border; e.currentTarget.style.color = UI_COLORS.fgMuted; }}>
                ↻
              </button>
            )}
          </div>
        </Field>
        {(form.paymentStatus === 'deposit_paid') && (
          <Field label="Balance Due ($)">
            <Input type="number" value={form.balanceDue || ''} onChange={v => set('balanceDue', Number(v))} />
          </Field>
        )}
        {/* Refund section — only show for existing cancelled appointments */}
        {appt?.id && form.status === 'cancelled' && (() => {
          const apptDate = form.date ? new Date(form.date + 'T' + (form.time || '00:00')) : null;
          const now = new Date();
          const hoursUntil = apptDate ? (apptDate - now) / (1000 * 60 * 60) : null;
          const refundEligible = hoursUntil !== null && hoursUntil > 24;
          return (
            <div style={{ background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink }}>Refund</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: refundEligible ? UI_COLORS.green : UI_COLORS.red }}>
                    {form.status === 'cancelled'
                      ? refundEligible ? '✓ Eligible (cancelled > 24hrs before)' : '✕ Non-refundable (< 24hrs)'
                      : hoursUntil !== null ? (refundEligible ? `${Math.round(hoursUntil)}hrs until appt — eligible if cancelled` : 'Within 24hrs — non-refundable') : '—'
                    }
                  </span>
                  <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener"
                    style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: UI_COLORS.pink, textDecoration: 'none', border: `1px solid ${UI_COLORS.pink}44`, padding: '4px 10px' }}>
                    Stripe →
                  </a>
                </div>
              </div>
              <Field label="Refund Status">
                <SelectInput value={form.refundStatus || 'none'} onChange={v => set('refundStatus', v)} options={[
                  { value: 'none', label: 'No refund' },
                  { value: 'refunded', label: 'Refunded in full' },
                  { value: 'partial', label: 'Partially refunded' },
                  { value: 'denied', label: 'Refund denied (< 24hrs)' },
                ]} />
              </Field>
              {form.refundStatus && form.refundStatus !== 'none' && (
                <Field label="Refund Notes" style={{ marginTop: 10 }}>
                  <Input value={form.refundNotes || ''} onChange={v => set('refundNotes', v)} placeholder="Amount refunded, reason, date issued…" />
                </Field>
              )}
            </div>
          );
        })()}
        {/* Stripe Payment Link Generator */}
        {form.clientId && form.service && form.price && (
          <div style={{ background: UI_COLORS.bg3, border: `1px solid ${stripeLink ? UI_COLORS.green+'44' : UI_COLORS.border}`, padding: '16px', transition: 'border-color 0.3s' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 12 }}>Stripe Payment Link</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <Btn size="sm" onClick={() => generateStripeLink('deposit')} disabled={generatingLink}>
                {generatingLink ? 'Generating…' : `Generate Deposit Link ($${Math.round(Number(form.price) * 0.5)})`}
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => generateStripeLink('full')} disabled={generatingLink}>
                Full (${form.price})
              </Btn>
            </div>
            {stripeLinkError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: UI_COLORS.red + '14', border: `1px solid ${UI_COLORS.red}44`, fontSize: 12, color: UI_COLORS.red, lineHeight: 1.6 }}>
                ⚠ {stripeLinkError}
              </div>
            )}
            {stripeLink && (
              <div style={{ background: UI_COLORS.green+'0d', border:`1px solid ${UI_COLORS.green}44`, padding:'12px', marginTop:4 }}>
                <div style={{ fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:UI_COLORS.green, marginBottom:8 }}>✓ Link ready — copy and send to client</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input readOnly value={stripeLink} style={{ flex: 1, background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.green}44`, color: UI_COLORS.green, fontFamily: UI_COLORS.sans, fontSize: 12, padding: '8px 10px', outline: 'none' }} onClick={e => e.target.select()} />
                  <Btn size="sm" variant="success" onClick={() => { navigator.clipboard.writeText(stripeLink); alert('Copied!'); }}>Copy</Btn>
                  <a href={stripeLink} target="_blank" rel="noopener" style={{ fontSize: 11, color: UI_COLORS.pink, textDecoration: 'none', border: `1px solid ${UI_COLORS.pink}44`, padding: '6px 12px', letterSpacing: '0.1em', whiteSpace:'nowrap' }}>Open →</a>
                </div>
              </div>
            )}
          </div>
        )}

        <Field label="Notes">
          <Textarea value={form.notes} onChange={v => set('notes', v)} placeholder="Lash style, preferences, reminders…" />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            {appt?.id && <Btn variant="danger" size="sm" onClick={() => { onDelete(appt.id); onClose(); }}>Delete</Btn>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {form.status === 'pending' && (
              <Btn variant="success" onClick={() => { onSave({ ...form, status: 'confirmed' }); onClose(); }}>✓ Confirm</Btn>
            )}
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={!canSave}>Save Appointment</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'calendar',  label: 'Calendar',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'clients',   label: 'Clients',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'pricing',   label: 'Pricing',   icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'finance',   label: 'Finance',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'waivers',   label: 'Waivers',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'gallery',   label: 'Gallery',   icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'stripe',    label: 'Payments',  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 'messages',  label: 'Messages',  icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

function Sidebar({ view, setView }) {
  return (
    <div style={{
      width: 220, flexShrink: 0, background: UI_COLORS.bg2,
      borderRight: `1px solid ${UI_COLORS.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 24px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
        <div style={{ fontFamily: UI_COLORS.serif, fontSize: 20, letterSpacing: '0.04em' }}>
          Krystle <em style={{ fontStyle: 'italic', color: UI_COLORS.pink }}>&amp; Co</em>
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.fgMuted, marginTop: 4 }}>
          Admin
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = view === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '10px 12px', marginBottom: 2,
              background: active ? UI_COLORS.pink + '18' : 'transparent',
              border: active ? `1px solid ${UI_COLORS.pink}33` : '1px solid transparent',
              color: active ? UI_COLORS.pink : UI_COLORS.fgMuted,
              fontFamily: UI_COLORS.sans, fontSize: 13, fontWeight: 400,
              letterSpacing: '0.05em', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${UI_COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href="../index.html" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: UI_COLORS.fgDim, textDecoration: 'none',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Website
        </a>
        <button onClick={() => { sessionStorage.removeItem('kc_auth'); window.location.reload(); }} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: UI_COLORS.fgDim, background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, textAlign: 'left',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Avatar, Badge, Btn, Field, Input, Textarea, SelectInput, Modal, AppointmentModal, Sidebar, UI_COLORS });
