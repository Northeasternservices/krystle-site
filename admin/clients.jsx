// Clients View
function ClientsView({ data, refresh, onNewAppt }) {
  const { useState, useEffect } = React;
  const { clients, appointments, services } = data;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  // Auto-select client if navigated from appointment modal
  useEffect(() => {
    if (window.__pendingClientId) {
      const c = clients.find(c => c.id === window.__pendingClientId);
      if (c) openClient(c);
      window.__pendingClientId = null;
    }
  }, []);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [allergiesValue, setAllergiesValue] = useState('');

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getAppts = (clientId) => appointments.filter(a => a.clientId === clientId).sort((a,b) => a.date > b.date ? -1 : 1);

  const openClient = (c) => { setSelected(c); setEditing(false); setEditingNotes(false); setEditingAllergies(false); };

  const saveNotes = (clientId, notes) => {
    const client = Store.clients.get(clientId);
    if (!client) return;
    Store.clients.save({ ...client, notes });
    refresh();
    setSelected(s => ({ ...s, notes }));
    setEditingNotes(false);
  };

  const saveAllergies = (clientId, allergies) => {
    const client = Store.clients.get(clientId);
    if (!client) return;
    Store.clients.save({ ...client, allergies });
    refresh();
    setSelected(s => ({ ...s, allergies }));
    setEditingAllergies(false);
  };

  const startEdit = () => { setEditForm({ ...selected }); setEditing(true); };

  const saveClient = () => {
    Store.clients.save(editForm);
    refresh();
    setSelected(editForm);
    setEditing(false);
  };

  const deleteClient = () => {
    if (!window.confirm('Delete this client? Their appointment history will remain.')) return;
    Store.clients.delete(selected.id);
    refresh();
    setSelected(null);
  };

  const set = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const referralOpts = ['Instagram','Facebook','Google','Word of mouth','Friend referral','Other'].map(v => ({ value: v, label: v }));

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Client list */}
      <div style={{ width: 320, borderRight: `1px solid ${UI_COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input value={search} onChange={setSearch} placeholder="Search clients…" style={{ flex: 1 }} />
            <Btn size="sm" onClick={() => { setEditForm({ name:'',phone:'',email:'',birthday:'',notes:'',allergies:'',patchTest:'',referral:'Instagram',totalSpent:0 }); setSelected(null); setEditing(true); }}>+</Btn>
          </div>
          <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{filtered.length} client{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => openClient(c)}
              style={{
                padding: '14px 16px', borderBottom: `1px solid ${UI_COLORS.border}33`,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                background: selected?.id === c.id ? UI_COLORS.pink + '10' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <Avatar name={c.name} size={38} photo={c.profilePhoto} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{c.phone}</div>
              </div>
              <div style={{ fontSize: 12, color: UI_COLORS.green, flexShrink: 0 }}>${c.totalSpent || 0}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Client detail / edit */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selected && !editing && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: UI_COLORS.fgMuted, gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Select a client to view their profile</span>
          </div>
        )}

        {editing && (
          <div style={{ padding: '28px 32px', maxWidth: 600 }}>
            <h2 style={{ fontFamily: UI_COLORS.serif, fontSize: 28, fontWeight: 300, marginBottom: 24 }}>
              {editForm.id ? 'Edit Client' : 'New Client'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Full Name" style={{ gridColumn: '1/-1' }}><Input value={editForm.name} onChange={v => set('name', v)} /></Field>
              <Field label="Phone"><Input value={editForm.phone} onChange={v => set('phone', v)} type="tel" /></Field>
              <Field label="Email"><Input value={editForm.email} onChange={v => set('email', v)} type="email" /></Field>
              <Field label="Birthday"><Input value={editForm.birthday} onChange={v => set('birthday', v)} type="date" /></Field>
              <Field label="Referral Source"><SelectInput value={editForm.referral} onChange={v => set('referral', v)} options={referralOpts} /></Field>
              <Field label="Patch Test Date"><Input value={editForm.patchTest} onChange={v => set('patchTest', v)} type="date" /></Field>
            </div>
            <Field label="Allergies / Sensitivities" style={{ marginBottom: 16 }}>
              <Input value={editForm.allergies} onChange={v => set('allergies', v)} placeholder="e.g. None, latex sensitivity…" />
            </Field>
            <Field label="Lash / Style Notes" style={{ marginBottom: 24 }}>
              <Textarea value={editForm.notes} onChange={v => set('notes', v)} placeholder="Preferred style, curl type, length, special requests…" rows={4} />
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={saveClient}>Save Client</Btn>
              <Btn variant="ghost" onClick={() => { setEditing(false); setEditForm({}); }}>Cancel</Btn>
            </div>
          </div>
        )}

        {selected && !editing && (() => {
          const clientAppts = getAppts(selected.id);
          const upcoming = clientAppts.filter(a => a.date >= DateUtil.today());
          const past = clientAppts.filter(a => a.date < DateUtil.today());
          const patchExpired = selected.patchTest && new Date(selected.patchTest) < new Date(new Date().setFullYear(new Date().getFullYear() - 1));
          return (
            <div style={{ padding: '28px 32px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <Avatar name={selected.name} size={56} photo={selected.profilePhoto} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: UI_COLORS.serif, fontSize: 30, fontWeight: 300 }}>{selected.name}</h2>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>{selected.phone}</span>
                    <span style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>{selected.email}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn size="sm" onClick={() => onNewAppt({ clientId: selected.id })}>+ Appointment</Btn>
                  <Btn size="sm" variant="ghost" onClick={startEdit}>Edit</Btn>
                  <Btn size="sm" variant="ghost" onClick={async () => {
                    const newPass = window.prompt('Set new password for ' + selected.name + ':');
                    if (!newPass) return;
                    const hash = await Auth.hashPassword(newPass);
                    const updated = { ...selected, passwordHash: hash };
                    Store.clients.save(updated);
                    refresh();
                    setSelected(updated);
                    alert('Password updated! Client can now log in with: ' + newPass);
                  }}>Reset Password</Btn>
                  <Btn size="sm" variant="danger" onClick={deleteClient}>Delete</Btn>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
                {[
                  ['Total Spent', `$${selected.totalSpent || 0}`, UI_COLORS.green],
                  ['Referral', selected.referral || '—', UI_COLORS.fg],
                  ['Birthday', selected.birthday ? DateUtil.format(selected.birthday, 'short') : '—', UI_COLORS.fg],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '16px 20px' }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.fgMuted, marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 20, fontFamily: UI_COLORS.serif, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Waiver status */}
              {(() => {
                const w = Store.waivers.forClient(selected.id);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: w ? UI_COLORS.green + '0d' : UI_COLORS.yellow + '0d', border: `1px solid ${w ? UI_COLORS.green + '33' : UI_COLORS.yellow + '33'}` }}>
                    <span style={{ fontSize: 12, color: w ? UI_COLORS.green : UI_COLORS.yellow }}>
                      {w ? `✓ Waiver signed ${DateUtil.format(w.signedDate, 'medium')}` : '⚠ No waiver on file'}
                    </span>
                    {w && w.noPhotos && <span style={{ fontSize: 11, color: UI_COLORS.fgMuted, marginLeft: 8 }}>· No photo consent</span>}
                    {w && (w.adhesiveAllergy || w.latexAllergy || w.formaldehydeAllergy) && (
                      <span style={{ fontSize: 11, color: UI_COLORS.red, marginLeft: 8 }}>· ⚠ Allergy on file</span>
                    )}
                  </div>
                );
              })()}

              {/* Patch test alert */}
              {patchExpired && (
                <div style={{ background: UI_COLORS.yellow + '15', border: `1px solid ${UI_COLORS.yellow}44`, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: UI_COLORS.yellow }}>
                  ⚠ Patch test from {DateUtil.format(selected.patchTest, 'short')} may be expired — consider retesting
                </div>
              )}

              {/* Notes / Allergies — inline editable */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                {/* Style Notes */}
                <div style={{ background: UI_COLORS.bg2, border: `1px solid ${editingNotes ? UI_COLORS.pink+'55' : UI_COLORS.border}`, padding: '16px 20px', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink }}>Style Notes</div>
                    {!editingNotes && (
                      <button onClick={() => { setNotesValue(selected.notes || ''); setEditingNotes(true); }}
                        style={{ background: 'transparent', border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fgMuted, cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}>
                        ✎ Edit
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        value={notesValue}
                        onChange={e => setNotesValue(e.target.value)}
                        rows={5}
                        autoFocus
                        placeholder="Preferred style, curl type, length, special requests…"
                        style={{ background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 13, fontWeight: 300, padding: '8px 10px', outline: 'none', width: '100%', resize: 'vertical', lineHeight: 1.7 }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn size="sm" onClick={() => saveNotes(selected.id, notesValue)}>Save</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: selected.notes ? UI_COLORS.fgMuted : UI_COLORS.fgDim, lineHeight: 1.7, cursor: 'pointer', margin: 0 }}
                      onClick={() => { setNotesValue(selected.notes || ''); setEditingNotes(true); }}>
                      {selected.notes || 'Click to add notes…'}
                    </p>
                  )}
                </div>

                {/* Allergies */}
                <div style={{ background: UI_COLORS.bg2, border: `1px solid ${editingAllergies ? UI_COLORS.red+'55' : UI_COLORS.border}`, padding: '16px 20px', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.red }}>Allergies</div>
                    {!editingAllergies && (
                      <button onClick={() => { setAllergiesValue(selected.allergies || ''); setEditingAllergies(true); }}
                        style={{ background: 'transparent', border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fgMuted, cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}>
                        ✎ Edit
                      </button>
                    )}
                  </div>
                  {editingAllergies ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        value={allergiesValue}
                        onChange={e => setAllergiesValue(e.target.value)}
                        rows={5}
                        autoFocus
                        placeholder="e.g. None, latex sensitivity…"
                        style={{ background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 13, fontWeight: 300, padding: '8px 10px', outline: 'none', width: '100%', resize: 'vertical', lineHeight: 1.7 }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn size="sm" onClick={() => saveAllergies(selected.id, allergiesValue)}>Save</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => setEditingAllergies(false)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: selected.allergies ? UI_COLORS.fgMuted : UI_COLORS.fgDim, lineHeight: 1.7, cursor: 'pointer', margin: 0 }}
                      onClick={() => { setAllergiesValue(selected.allergies || ''); setEditingAllergies(true); }}>
                      {selected.allergies || 'Click to add allergies…'}
                    </p>
                  )}
                </div>
              </div>

              {/* Photo gallery for this client */}
              {(() => {
                const clientPhotos = Store.photos.forClient(selected.id);
                if (clientPhotos.length === 0) return null;
                return (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.fgMuted, marginBottom: 12 }}>
                      Photos · {clientPhotos.length}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
                      {clientPhotos.map(photo => (
                        <div key={photo.id} style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                          <img src={photo.dataUrl} alt={photo.tag}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {photo.featured && (
                            <div style={{ position: 'absolute', top: 4, right: 4, background: UI_COLORS.pink, color: UI_COLORS.bg, fontSize: 8, padding: '2px 5px' }}>★</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Appointment history */}
              <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.fgMuted, marginBottom: 12 }}>
                Appointment History · {clientAppts.length} total
              </div>
              {clientAppts.map(appt => (
                <div key={appt.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                  borderBottom: `1px solid ${UI_COLORS.border}33`,
                }}>
                  <div style={{ width: 4, height: 40, background: appt.date >= DateUtil.today() ? UI_COLORS.pink : UI_COLORS.fgDim, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, marginBottom: 2 }}>{appt.service}</div>
                    <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{DateUtil.format(appt.date, 'medium')} · {DateUtil.formatTime(appt.time)}</div>
                  </div>
                  <div style={{ fontSize: 14, color: UI_COLORS.green }}>${appt.price}</div>
                  <Badge status={appt.status} />
                </div>
              ))}
              {clientAppts.length === 0 && <div style={{ color: UI_COLORS.fgMuted, fontSize: 13 }}>No appointments yet</div>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
window.ClientsView = ClientsView;
