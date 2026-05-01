// Stripe & Payments Admin View
function StripeView({ data, refresh }) {
  const { useState } = React;
  const { appointments, clients, services } = data;
  const [settings, setSettings] = useState(() => Store.settings.get());
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('settings'); // settings | outstanding | history

  const today = DateUtil.today();

  const saveSettings = () => {
    Store.settings.save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const setStripeLink = (serviceId, type, val) => {
    const links = { ...settings.stripeLinks };
    if (!links[serviceId]) links[serviceId] = {};
    links[serviceId][type] = val;
    setSettings(s => ({ ...s, stripeLinks: links }));
  };

  // Outstanding balances
  const outstanding = appointments.filter(a =>
    a.status !== 'cancelled' &&
    a.paymentStatus !== 'paid_full' &&
    a.date <= today
  ).sort((a,b) => a.date > b.date ? -1 : 1);

  const totalOutstanding = outstanding.reduce((sum, a) => {
    if (a.paymentStatus === 'deposit_paid') return sum + (Number(a.balanceDue) || 0);
    return sum + (Number(a.price) || 0);
  }, 0);

  // Mark payment
  const markPaid = (appt, type) => {
    const updated = {
      ...appt,
      paymentStatus: type,
      ...(type === 'paid_full' ? { balanceDue: 0 } : {}),
    };
    Store.appointments.save(updated);
    refresh();
  };

  // Send payment link via SMS — uses dynamic API link generation
  const sendPaymentLink = async (appt, type) => {
    const client = clients.find(c => c.id === appt.clientId);
    const phone = client?.phone || appt.clientPhone;
    const name = client?.name?.split(' ')[0] || appt.clientName?.split(' ')[0] || 'there';
    const svc = services.find(s => s.name === appt.service);
    const depositAmt = appt.depositAmount || Math.round(appt.price * (settings.depositPercent || 50) / 100);
    const amt = type === 'deposit' ? depositAmt : (appt.balanceDue || appt.price);

    let link = '[payment link]';
    try {
      const res = await fetch('https://api.krystleandco.com/api/stripe/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: svc?.id,
          serviceName: appt.service,
          amount: amt,
          type,
          appointmentId: appt.id,
          clientId: appt.clientId,
          clientEmail: client?.email || appt.clientEmail,
        }),
      });
      if (res.ok) { const data = await res.json(); link = data.url || data.link || link; }
    } catch {
      // fallback to static link
      link = type === 'deposit'
        ? settings.stripeLinks?.[svc?.id]?.depositLink || settings.stripeLinks?.default?.depositLink || '[your Stripe link]'
        : settings.stripeLinks?.[svc?.id]?.fullLink || settings.stripeLinks?.default?.fullLink || '[your Stripe link]';
    }

    const msg = type === 'deposit'
      ? `Hi ${name}! To confirm your ${appt.service} on ${DateUtil.format(appt.date, 'short')}, please pay your $${amt} deposit here: ${link} — Krystle & Co 💕`
      : `Hi ${name}! Your ${appt.service} balance of $${amt} is due. Pay here: ${link} — Krystle & Co 💕`;

    await Store.messages.send({ to: phone, body: msg, type: 'payment_link', clientId: appt.clientId });
    alert(`Payment link sent to ${phone}`);
  };

  const getPaymentColor = (status) => {
    if (status === 'paid_full') return UI_COLORS.green;
    if (status === 'deposit_paid') return UI_COLORS.yellow;
    return UI_COLORS.red;
  };

  const getPaymentLabel = (appt) => {
    if (appt.paymentStatus === 'paid_full') return 'Paid in Full';
    if (appt.paymentStatus === 'deposit_paid') return `Deposit Paid — $${appt.balanceDue || 0} due`;
    if (appt.paymentStatus === 'deposit_pending') return 'Deposit Pending';
    return 'Unpaid';
  };

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 6 }}>Payments</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <h1 style={{ fontFamily: UI_COLORS.serif, fontSize: 36, fontWeight: 300 }}>
            Stripe <em style={{ fontStyle: 'italic', color: UI_COLORS.pink }}>&amp; Payments</em>
          </h1>
          <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener"
            style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color: UI_COLORS.pink, textDecoration:'none', border:`1px solid ${UI_COLORS.pink}44`, padding:'10px 18px', marginBottom:4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Open Stripe Dashboard
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${UI_COLORS.border}`, marginBottom: 32 }}>
        {[['settings','Settings'],['outstanding','Outstanding'],['history','Payment History'],['guide','Setup Guide']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '10px 24px', background: 'none', border: 'none',
            borderBottom: tab === id ? `2px solid ${UI_COLORS.pink}` : '2px solid transparent',
            color: tab === id ? UI_COLORS.pink : UI_COLORS.fgMuted,
            fontFamily: UI_COLORS.sans, fontSize: 11, letterSpacing: '0.12em',
            textTransform: 'uppercase', cursor: 'pointer', marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* Settings */}
      {tab === 'settings' && (
        <div style={{ maxWidth: 700 }}>
          {/* Deposit settings */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '28px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 20 }}>Deposit Settings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Deposit Percentage (%)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min="0" max="100" step="5" value={settings.depositPercent || 50}
                    onChange={e => set('depositPercent', Number(e.target.value))}
                    style={{ flex: 1, accentColor: UI_COLORS.pink }} />
                  <span style={{ fontFamily: UI_COLORS.serif, fontSize: 28, color: UI_COLORS.pink, minWidth: 48 }}>
                    {settings.depositPercent || 50}%
                  </span>
                </div>
              </Field>
              <Field label="Booking Buffer (min between appts)">
                <SelectInput value={settings.bookingBuffer || 60} onChange={v => set('bookingBuffer', Number(v))}
                  options={[15,30,45,60,90].map(n => ({ value: n, label: `${n} min` }))} />
              </Field>
            </div>
            <div style={{ fontSize: 12, color: UI_COLORS.fgMuted, padding: '12px 16px', background: UI_COLORS.bg3, borderLeft: `2px solid ${UI_COLORS.pink}` }}>
              At {settings.depositPercent || 50}% deposit, a ${Math.round(155 * (settings.depositPercent || 50) / 100)} deposit would be required for a $155 Hybrid Full Set
            </div>
          </div>

          {/* Admin API Token */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '28px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 8 }}>API Connection</div>
            <div style={{ fontSize: 12, color: UI_COLORS.fgMuted, marginBottom: 20, lineHeight: 1.7 }}>
              Paste your admin API token below. This is sent with every price save to generate new Stripe links automatically.
              Keep this private — treat it like a password.
            </div>
            <Field label="Admin API Token">
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  type="password"
                  value={settings.adminApiToken || ''}
                  onChange={v => set('adminApiToken', v)}
                  placeholder="Paste your Bearer token here…"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                {settings.adminApiToken && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: UI_COLORS.green, flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Set
                  </div>
                )}
              </div>
            </Field>
          </div>

          {/* Stripe API */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '28px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 8 }}>Fallback Stripe Links</div>
            <div style={{ fontSize: 12, color: UI_COLORS.fgMuted, marginBottom: 20, lineHeight: 1.7 }}>
              Used only if a service has no auto-generated link yet. Once the API token is set and you save a price, links are generated automatically.
            </div>
            <Field label="Default Deposit Payment Link">
              <Input value={settings.stripeLinks?.default?.depositLink || ''} onChange={v => setStripeLink('default', 'depositLink', v)} placeholder="https://buy.stripe.com/..." />
            </Field>
            <Field label="Default Full Payment Link" style={{ marginTop: 12 }}>
              <Input value={settings.stripeLinks?.default?.fullLink || ''} onChange={v => setStripeLink('default', 'fullLink', v)} placeholder="https://buy.stripe.com/..." />
            </Field>
          </div>

          {/* Per-service Stripe links */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '28px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink }}>Stripe Links per Service</div>
              <span style={{ fontSize: 11, color: UI_COLORS.fgMuted, letterSpacing: '0.05em' }}>
                Auto-generated links are read-only — change prices in the Pricing tab
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {services.map(svc => {
                const depositAmt = Math.round(svc.price * (settings.depositPercent || 50) / 100);
                const links = settings.stripeLinks?.[svc.id];
                const isAuto = links?.autoGenerated;
                const lastUpdated = links?.lastUpdated ? new Date(links.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;
                return (
                  <div key={svc.id} style={{
                    padding: '16px 20px', background: UI_COLORS.bg3,
                    borderLeft: `2px solid ${isAuto ? UI_COLORS.green : UI_COLORS.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{svc.name}</span>
                      {isAuto && (
                        <span style={{
                          fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
                          color: UI_COLORS.green, border: `1px solid ${UI_COLORS.green}44`,
                          padding: '2px 7px',
                        }}>Auto-synced</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: UI_COLORS.fgMuted, marginBottom: isAuto ? 8 : 12 }}>
                      ${svc.price} total · ${depositAmt} deposit · ${svc.price - depositAmt} balance
                      {lastUpdated && <span style={{ marginLeft: 10, color: UI_COLORS.fgDim }}>· Updated {lastUpdated}</span>}
                    </div>

                    {isAuto ? (
                      /* Read-only display for auto-generated links */
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { label: `Deposit Link ($${depositAmt})`, val: links?.depositLink },
                          { label: `Full Payment Link ($${svc.price})`, val: links?.fullLink },
                        ].map(({ label, val }) => (
                          <div key={label}>
                            <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.fgDim, marginBottom: 6 }}>{label}</div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`,
                              padding: '8px 12px',
                            }}>
                              <span style={{ fontSize: 11, color: UI_COLORS.fgMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                {val || '—'}
                              </span>
                              {val && (
                                <button onClick={() => { navigator.clipboard.writeText(val); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: UI_COLORS.pink, fontSize: 11, padding: 0, flexShrink: 0 }}
                                  title="Copy link">
                                  Copy
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Manual input for services without auto links */
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <Field label={`Deposit Link ($${depositAmt})`}>
                          <Input value={settings.stripeLinks?.[svc.id]?.depositLink || ''} onChange={v => setStripeLink(svc.id, 'depositLink', v)} placeholder="https://buy.stripe.com/..." style={{ fontSize: 12 }} />
                        </Field>
                        <Field label={`Full Payment Link ($${svc.price})`}>
                          <Input value={settings.stripeLinks?.[svc.id]?.fullLink || ''} onChange={v => setStripeLink(svc.id, 'fullLink', v)} placeholder="https://buy.stripe.com/..." style={{ fontSize: 12 }} />
                        </Field>
                        <div style={{ gridColumn: '1/-1', fontSize: 11, color: UI_COLORS.fgDim }}>
                          → Once your backend is connected, links will auto-generate when you save a price in the Pricing tab
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Btn onClick={saveSettings} style={{ minWidth: 160 }}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </Btn>
        </div>
      )}

      {/* Outstanding */}
      {tab === 'outstanding' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: UI_COLORS.fgMuted }}>{outstanding.length} appointments with outstanding balance</span>
            <span style={{ fontFamily: UI_COLORS.serif, fontSize: 24, color: UI_COLORS.red }}>−${totalOutstanding} outstanding</span>
          </div>
          {outstanding.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: UI_COLORS.fgMuted }}>All payments up to date ✨</div>
          )}
          {outstanding.map(appt => {
            const client = clients.find(c => c.id === appt.clientId);
            const name = client?.name || appt.clientName || 'Unknown';
            const amtDue = appt.paymentStatus === 'deposit_paid' ? (appt.balanceDue || 0) : (appt.price || 0);
            return (
              <div key={appt.id} style={{
                background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`,
                marginBottom: 12, padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar name={name} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>{appt.service} · {DateUtil.format(appt.date, 'medium')}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 16 }}>
                    <div style={{ fontFamily: UI_COLORS.serif, fontSize: 22, color: UI_COLORS.red }}>−${amtDue}</div>
                    <div style={{ fontSize: 11, color: getPaymentColor(appt.paymentStatus), marginTop: 2 }}>{getPaymentLabel(appt)}</div>
                    {appt.refundStatus && appt.refundStatus !== 'none' && (
                      <div style={{ fontSize: 10, marginTop: 4, color:
                        appt.refundStatus === 'refunded' ? UI_COLORS.green :
                        appt.refundStatus === 'denied' ? UI_COLORS.red : UI_COLORS.yellow
                      }}>
                        {appt.refundStatus === 'refunded' ? '↩ Refunded' :
                         appt.refundStatus === 'partial' ? '↩ Partial refund' : '✕ Refund denied'}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {appt.paymentStatus !== 'deposit_paid' && appt.paymentStatus !== 'paid_full' && (
                      <>
                        <Btn size="sm" onClick={() => sendPaymentLink(appt, 'deposit')}>Send Deposit Link</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => markPaid(appt, 'deposit_paid')}>Mark Deposit Paid</Btn>
                      </>
                    )}
                    {appt.paymentStatus === 'deposit_paid' && (
                      <>
                        <Btn size="sm" onClick={() => sendPaymentLink(appt, 'balance')}>Send Balance Link</Btn>
                        <Btn size="sm" variant="success" onClick={() => markPaid(appt, 'paid_full')}>Mark Paid in Full</Btn>
                      </>
                    )}
                    {appt.paymentStatus === 'deposit_pending' && (
                      <Btn size="sm" variant="ghost" onClick={() => markPaid(appt, 'deposit_paid')}>Mark Deposit Received</Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment History */}
      {tab === 'history' && (
        <div>
          {appointments.filter(a => a.paymentStatus === 'paid_full').length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: UI_COLORS.fgMuted }}>No fully paid appointments yet</div>
          )}
          {appointments.filter(a => a.paymentStatus === 'paid_full').sort((a,b) => a.date > b.date ? -1 : 1).map(appt => {
            const client = clients.find(c => c.id === appt.clientId);
            return (
              <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${UI_COLORS.border}33` }}>
                <div style={{ width: 4, height: 40, background: UI_COLORS.green, flexShrink: 0 }} />
                <Avatar name={client?.name || appt.clientName} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{client?.name || appt.clientName}</div>
                  <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{appt.service} · {DateUtil.format(appt.date, 'short')}</div>
                </div>
                <div style={{ fontFamily: UI_COLORS.serif, fontSize: 20, color: UI_COLORS.green }}>${appt.price}</div>
                <span style={{ fontSize: 11, color: UI_COLORS.green, letterSpacing: '0.1em' }}>Paid in Full</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup Guide */}
      {tab === 'guide' && (
        <div style={{ maxWidth: 680 }}>
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px 28px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 12 }}>What Stripe does for you</div>
            <p style={{ fontSize: 13, color: UI_COLORS.fgMuted, lineHeight: 1.9 }}>
              Stripe lets you collect deposits when clients book online, send payment links via text, and get paid directly to your bank. No monthly fees — Stripe charges 2.9% + 30¢ per transaction only when you get paid.
            </p>
          </div>

          {[
            { step: '01', title: 'Create your Stripe account', color: UI_COLORS.pink, items: [
              { label: 'Go to', link: 'https://stripe.com', linkText: 'stripe.com' },
              { label: 'Click "Start now" and sign up with your email' },
              { label: 'Fill in: Krystle & Co · Sole proprietor · Ashland, MA · Beauty/Personal Care' },
              { label: 'Add your bank account under Settings → Bank accounts' },
            ]},
            { step: '02', title: 'Create Payment Links', color: 'oklch(0.65 0.16 200)', items: [
              { label: 'In Stripe dashboard → go to', link: 'https://dashboard.stripe.com/payment-links', linkText: 'Payment Links' },
              { label: 'Click "+ New" → choose a fixed price' },
              { label: 'Create one deposit link per service (see table below)' },
              { label: 'Also create full-price links for each service' },
              { label: 'Copy each URL — you\'ll paste them in the Settings tab' },
            ]},
            { step: '03', title: 'Paste links in Settings', color: UI_COLORS.green, items: [
              { label: 'Click the "Settings" tab above' },
              { label: 'Paste each Stripe Payment Link next to its service' },
              { label: 'Adjust deposit % if needed (default 50%)' },
              { label: 'Click "Save Settings"' },
              { label: 'Test by booking on your site — deposit link will appear at checkout ✓' },
            ]},
          ].map(section => (
            <div key={section.step} style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px 28px', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ fontFamily: UI_COLORS.serif, fontSize: 36, fontWeight: 300, color: section.color, lineHeight: 1, flexShrink: 0 }}>{section.step}</div>
                <div style={{ fontSize: 18, fontFamily: UI_COLORS.serif, fontWeight: 300, alignSelf: 'center' }}>{section.title}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: UI_COLORS.fgMuted, lineHeight: 1.6 }}>
                    <span style={{ color: section.color, flexShrink: 0 }}>→</span>
                    <span>{item.label}{' '}{item.link && <a href={item.link} target="_blank" rel="noopener" style={{ color: section.color }}>{item.linkText}</a>}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Deposit table */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, marginBottom: 16 }}>
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
              <span style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink }}>
                Suggested Deposit Amounts ({settings.depositPercent || 50}%)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '10px 24px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
              {['Service','Full Price','Deposit'].map(h => <span key={h} style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.fgDim }}>{h}</span>)}
            </div>
            {data.services.map(svc => {
              const dep = Math.round(svc.price * (settings.depositPercent || 50) / 100);
              return (
                <div key={svc.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '11px 24px', borderBottom: `1px solid ${UI_COLORS.border}22`, fontSize: 13, alignItems: 'center' }}>
                  <span>{svc.name}</span>
                  <span style={{ color: UI_COLORS.fgMuted }}>${svc.price}</span>
                  <span style={{ color: UI_COLORS.green, fontFamily: UI_COLORS.serif, fontSize: 15 }}>${dep}</span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '14px 18px', background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`, fontSize: 12, color: UI_COLORS.fgMuted, lineHeight: 1.7 }}>
            💳 <strong style={{ color: UI_COLORS.fg }}>Stripe fees:</strong> 2.9% + $0.30 per successful payment. On a $78 deposit that's ~$2.56. No monthly fees, no setup fees.
          </div>

          {/* Refund guide */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px 28px', marginTop: 16 }}>
            <div style={{ fontFamily: UI_COLORS.serif, fontSize: 20, fontWeight: 300, marginBottom: 16 }}>How Refunds Work</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { rule: 'Cancelled > 24hrs before', result: 'Full deposit refund', color: UI_COLORS.green },
                { rule: 'Cancelled < 24hrs before', result: 'Deposit kept — non-refundable', color: UI_COLORS.red },
                { rule: 'No-show', result: 'Deposit kept — non-refundable', color: UI_COLORS.red },
                { rule: 'Service issue / your cancellation', result: 'Full refund at your discretion', color: UI_COLORS.yellow },
              ].map(r => (
                <div key={r.rule} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: UI_COLORS.bg3 }}>
                  <span style={{ fontSize: 13, color: UI_COLORS.fgMuted }}>{r.rule}</span>
                  <span style={{ fontSize: 12, color: r.color, fontWeight: 500 }}>{r.result}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: UI_COLORS.fgMuted, lineHeight: 1.8 }}>
              To issue a refund: open <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener" style={{ color: UI_COLORS.pink }}>Stripe → Payments</a> → find the charge → click Refund. Then update the appointment in your admin with the refund status and notes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.StripeView = StripeView;
