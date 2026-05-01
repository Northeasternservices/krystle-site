// Pricing View
function PricingView({ data, refresh }) {
  const { useState } = React;
  const { services } = data;
  const [editing, setEditing] = useState(null);
  const [addingCat, setAddingCat] = useState('');
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'synced' | 'offline' | 'error'

  const categories = [...new Set(services.map(s => s.category))];

  const startEdit = (svc) => setEditing({ ...svc });
  const startNew = (category) => setEditing({ id: '', name: '', price: '', duration: 60, category });
  const cancelEdit = () => { setEditing(null); setSaveStatus(null); };

  const saveService = async () => {
    if (!editing.name || !editing.price) return;
    setSaveStatus('saving');
    const result = await Store.services.save(editing);
    refresh();
    setEditing(null);
    if (!result || result.ok) {
      setSaveStatus('synced');
    } else if (result.offline) {
      setSaveStatus('offline');
    } else {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const deleteService = (id) => {
    if (!window.confirm('Remove this service?')) return;
    Store.services.delete(id);
    refresh();
  };

  const set = (k, v) => setEditing(e => ({ ...e, [k]: v }));

  const addCategory = () => {
    const cat = addingCat.trim();
    if (!cat) return;
    Store.services.save({ id: '', name: 'New Service', price: 0, duration: 60, category: cat });
    refresh();
    setAddingCat('');
  };

  // Status pill
  const StatusPill = () => {
    if (!saveStatus) return null;
    const map = {
      saving: { label: '⟳  Saving & syncing Stripe…', color: UI_COLORS.yellow },
      synced: { label: '✓  Saved — Stripe links updated', color: UI_COLORS.green },
      offline: { label: '✓  Saved locally — Stripe will sync when backend is ready', color: UI_COLORS.yellow },
      error:   { label: '⚠  Saved locally — Stripe sync failed', color: UI_COLORS.red },
    };
    const s = map[saveStatus];
    return (
      <div style={{
        position: 'fixed', bottom: 28, right: 36, zIndex: 100,
        background: UI_COLORS.bg2, border: `1px solid ${s.color}44`,
        padding: '12px 20px', fontSize: 12, color: s.color,
        letterSpacing: '0.05em', boxShadow: `0 4px 24px ${s.color}22`,
        display: 'flex', alignItems: 'center', gap: 8,
        animation: 'fadeIn 0.2s ease',
      }}>
        {s.label}
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }`}</style>
      <StatusPill />

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 6 }}>Manage</div>
          <h1 style={{ fontFamily: UI_COLORS.serif, fontSize: 36, fontWeight: 300 }}>Services <em style={{ fontStyle: 'italic', color: UI_COLORS.pink }}>&amp; Pricing</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input value={addingCat} onChange={setAddingCat} placeholder="New category name…" style={{ width: 200 }} />
          <Btn size="sm" variant="ghost" onClick={addCategory}>+ Category</Btn>
        </div>
      </div>

      {/* Stripe sync notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`,
        borderLeft: `3px solid ${UI_COLORS.pink}`, padding: '14px 18px',
        marginBottom: 28, fontSize: 12, color: UI_COLORS.fgMuted, lineHeight: 1.7,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={UI_COLORS.pink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>
          When you save a price change, new Stripe payment links are automatically generated for that service.
          Old links stop working — any clients with the old link will need a new one sent.{' '}
          <span style={{ color: UI_COLORS.fg }}>Deposit % is set in the Stripe tab.</span>
        </span>
      </div>

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink }}>{cat}</span>
            <div style={{ flex: 1, height: 1, background: UI_COLORS.border }} />
            <Btn size="sm" variant="ghost" onClick={() => startNew(cat)}>+ Add</Btn>
          </div>

          <div style={{ border: `1px solid ${UI_COLORS.border}`, background: UI_COLORS.bg2 }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 120px', gap: 0, padding: '10px 20px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
              {['Service', 'Price', 'Duration', '', 'Stripe'].map(h => (
                <span key={h} style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.fgDim }}>{h}</span>
              ))}
            </div>

            {services.filter(s => s.category === cat).map(svc => {
              const settings = Store.settings.get();
              const links = settings.stripeLinks?.[svc.id];
              const hasLinks = links?.depositLink || links?.fullLink;
              const isAutoGenerated = links?.autoGenerated;

              return (
                <div key={svc.id}>
                  {editing?.id === svc.id ? (
                    <div style={{ padding: '16px 20px', background: UI_COLORS.bg3, borderBottom: `1px solid ${UI_COLORS.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 12, marginBottom: 8 }}>
                        <Field label="Service Name"><Input value={editing.name} onChange={v => set('name', v)} /></Field>
                        <Field label="Price ($)"><Input type="number" value={editing.price} onChange={v => set('price', Number(v))} /></Field>
                        <Field label="Duration (min)"><Input type="number" value={editing.duration} onChange={v => set('duration', Number(v))} /></Field>
                      </div>
                      {editing.price !== svc.price && (
                        <div style={{ fontSize: 11, color: UI_COLORS.yellow, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          Price changed — new Stripe links will be generated on save
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn size="sm" onClick={saveService} disabled={saveStatus === 'saving'}>
                          {saveStatus === 'saving' ? 'Saving…' : 'Save'}
                        </Btn>
                        <Btn size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 120px',
                      padding: '14px 20px', borderBottom: `1px solid ${UI_COLORS.border}33`,
                      alignItems: 'center', transition: 'background 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = UI_COLORS.bg3}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 14 }}>{svc.name}</span>
                      <span style={{ fontSize: 16, fontFamily: UI_COLORS.serif, color: UI_COLORS.green }}>${svc.price}</span>
                      <span style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>{svc.duration} min</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn size="sm" variant="ghost" onClick={() => startEdit(svc)}>Edit</Btn>
                        <Btn size="sm" variant="danger" onClick={() => deleteService(svc.id)}>✕</Btn>
                      </div>
                      {/* Stripe link status */}
                      <div>
                        {hasLinks ? (
                          <span style={{
                            fontSize: 10, letterSpacing: '0.08em', color: isAutoGenerated ? UI_COLORS.green : UI_COLORS.fgMuted,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill={isAutoGenerated ? UI_COLORS.green : UI_COLORS.fgMuted} stroke="none">
                              <circle cx="12" cy="12" r="12"/>
                            </svg>
                            {isAutoGenerated ? 'Auto' : 'Manual'}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: UI_COLORS.fgDim, letterSpacing: '0.05em' }}>No link</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* New service inline form */}
            {editing && !editing.id && editing.category === cat && (
              <div style={{ padding: '16px 20px', background: UI_COLORS.bg3 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 12, marginBottom: 12 }}>
                  <Field label="Service Name"><Input value={editing.name} onChange={v => set('name', v)} placeholder="e.g. Mega Volume Fill" /></Field>
                  <Field label="Price ($)"><Input type="number" value={editing.price} onChange={v => set('price', Number(v))} /></Field>
                  <Field label="Duration (min)"><Input type="number" value={editing.duration} onChange={v => set('duration', Number(v))} /></Field>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Btn size="sm" onClick={saveService} disabled={saveStatus === 'saving'}>
                    {saveStatus === 'saving' ? 'Saving…' : 'Add Service'}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Btn>
                  <span style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>Stripe links will be generated automatically</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
window.PricingView = PricingView;
