// Waivers & Medical History View
function WaiversView({ data, refresh }) {
  const { useState } = React;
  const { clients } = data;

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // client
  const [waiver, setWaiver] = useState(null);
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [form, setForm] = useState({});

  const allWaivers = Store.waivers.all();
  const signedIds = new Set(allWaivers.map(w => w.clientId));

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const openClient = (c) => {
    setSelected(c);
    const w = Store.waivers.forClient(c.id);
    setWaiver(w);
    setMode('view');
    setForm({});
  };

  const startNew = () => {
    setForm({
      clientId: selected.id,
      // Medical history
      contactLenses: false, eyeSurgery: false, glaucoma: false, dryEyes: false, eyeAllergy: false,
      skinConditions: '', medications: '', previousReaction: false, previousReactionDetails: '',
      pregnant: false, chemotherapy: false,
      // Allergies
      latexAllergy: false, adhesiveAllergy: false, formaldehydeAllergy: false, otherAllergies: '',
      // Consent
      signature: '', signedDate: DateUtil.today(),
    });
    setMode('edit');
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.signature.trim()) { alert('Please provide a signature (type full name).'); return; }
    Store.waivers.save(form);
    refresh();
    const w = Store.waivers.forClient(selected.id);
    setWaiver(w);
    setMode('view');
  };

  const handleDelete = () => {
    if (!window.confirm('Remove this waiver? This cannot be undone.')) return;
    Store.waivers.delete(selected.id);
    refresh();
    setWaiver(null);
    setMode('view');
  };

  const CheckBox = ({ label, checked, onChange, color }) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '6px 0' }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 16, height: 16, border: `1px solid ${checked ? (color || UI_COLORS.pink) : UI_COLORS.border}`,
        background: checked ? (color || UI_COLORS.pink) : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s',
      }}>
        {checked && <span style={{ color: UI_COLORS.bg, fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: checked ? UI_COLORS.fg : UI_COLORS.fgMuted, lineHeight: 1.5 }}>{label}</span>
    </label>
  );

  const Section = ({ title, color, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: color || UI_COLORS.pink, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${UI_COLORS.border}` }}>
        {title}
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value, color }) => (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${UI_COLORS.border}22` }}>
      <div style={{ fontSize: 11, color: UI_COLORS.fgMuted, width: 200, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: color || UI_COLORS.fg }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Client list */}
      <div style={{ width: 300, borderRight: `1px solid ${UI_COLORS.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 6 }}>Documents</div>
          <h2 style={{ fontFamily: UI_COLORS.serif, fontSize: 26, fontWeight: 300, marginBottom: 14 }}>Waivers</h2>
          <Input value={search} onChange={setSearch} placeholder="Search clients…" />
          <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: UI_COLORS.fgMuted }}>
            <span style={{ color: UI_COLORS.green }}>{signedIds.size} signed</span>
            <span>·</span>
            <span style={{ color: UI_COLORS.yellow }}>{clients.length - signedIds.size} pending</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(c => {
            const signed = signedIds.has(c.id);
            return (
              <div key={c.id} onClick={() => openClient(c)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  borderBottom: `1px solid ${UI_COLORS.border}33`, cursor: 'pointer',
                  background: selected?.id === c.id ? UI_COLORS.pink + '10' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                <Avatar name={c.name} size={36} photo={c.profilePhoto} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: UI_COLORS.fgMuted, marginTop: 2 }}>{c.phone}</div>
                </div>
                <div style={{
                  fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '3px 8px', flexShrink: 0,
                  background: signed ? UI_COLORS.green + '18' : UI_COLORS.yellow + '18',
                  border: `1px solid ${signed ? UI_COLORS.green + '44' : UI_COLORS.yellow + '44'}`,
                  color: signed ? UI_COLORS.green : UI_COLORS.yellow,
                }}>
                  {signed ? 'Signed' : 'Pending'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selected && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: UI_COLORS.fgMuted, gap: 12 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Select a client to view their waiver</span>
          </div>
        )}

        {selected && mode === 'view' && (
          <div style={{ padding: '28px 36px', maxWidth: 760 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={selected.name} size={48} photo={selected.profilePhoto} />
                <div>
                  <h2 style={{ fontFamily: UI_COLORS.serif, fontSize: 28, fontWeight: 300 }}>{selected.name}</h2>
                  <div style={{ fontSize: 12, color: UI_COLORS.fgMuted, marginTop: 4 }}>
                    {waiver ? `Signed ${DateUtil.format(waiver.signedDate, 'medium')}` : 'No waiver on file'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {waiver && <Btn size="sm" variant="ghost" onClick={() => { setForm({ ...waiver }); setMode('edit'); }}>Edit Waiver</Btn>}
                {waiver && <Btn size="sm" variant="danger" onClick={handleDelete}>Remove</Btn>}
                {!waiver && <Btn size="sm" onClick={startNew}>+ New Waiver</Btn>}
              </div>
            </div>

            {!waiver && (
              <div style={{ padding: '48px', textAlign: 'center', border: `2px dashed ${UI_COLORS.border}`, color: UI_COLORS.fgMuted }}>
                <div style={{ fontFamily: UI_COLORS.serif, fontSize: 20, marginBottom: 10 }}>No waiver on file</div>
                <p style={{ fontSize: 13, marginBottom: 20 }}>This client hasn't completed their waiver & medical history form yet.</p>
                <Btn onClick={startNew}>+ Complete Waiver Now</Btn>
              </div>
            )}

            {waiver && (
              <>
                <Section title="Medical History" color={UI_COLORS.pink}>
                  {[
                    ['Contact Lenses', waiver.contactLenses],
                    ['Eye Surgery (LASIK, etc.)', waiver.eyeSurgery],
                    ['Glaucoma / Eye Pressure Issues', waiver.glaucoma],
                    ['Dry Eyes', waiver.dryEyes],
                    ['Eye Allergies / Sensitive Eyes', waiver.eyeAllergy],
                    ['Currently Pregnant', waiver.pregnant],
                    ['Undergoing Chemotherapy / Radiation', waiver.chemotherapy],
                    ['Previous Reaction to Lash Extensions', waiver.previousReaction],
                  ].map(([label, val]) => (
                    <InfoRow key={label} label={label} value={val ? 'Yes' : 'No'} color={val ? UI_COLORS.yellow : UI_COLORS.green} />
                  ))}
                  {waiver.previousReaction && waiver.previousReactionDetails && (
                    <InfoRow label="Reaction Details" value={waiver.previousReactionDetails} />
                  )}
                  {waiver.skinConditions && <InfoRow label="Skin Conditions" value={waiver.skinConditions} />}
                  {waiver.medications && <InfoRow label="Medications" value={waiver.medications} />}
                </Section>

                <Section title="Allergy Disclosures" color={UI_COLORS.red}>
                  {[
                    ['Latex Allergy', waiver.latexAllergy],
                    ['Adhesive / Cyanoacrylate Allergy', waiver.adhesiveAllergy],
                    ['Formaldehyde Sensitivity', waiver.formaldehydeAllergy],
                  ].map(([label, val]) => (
                    <InfoRow key={label} label={label} value={val ? 'Yes ⚠' : 'No'} color={val ? UI_COLORS.red : UI_COLORS.green} />
                  ))}
                  {waiver.otherAllergies && <InfoRow label="Other Allergies" value={waiver.otherAllergies} />}
                </Section>

                <Section title="Consent & Signature" color={UI_COLORS.green}>
                  <InfoRow label="Client Signature" value={waiver.signature} color={UI_COLORS.pink} />
                  <InfoRow label="Date Signed" value={DateUtil.format(waiver.signedDate, 'medium')} />
                  {waiver.updatedAt && waiver.updatedAt !== waiver.createdAt && (
                    <InfoRow label="Last Updated" value={DateUtil.format(waiver.updatedAt, 'medium')} />
                  )}
                </Section>
              </>
            )}
          </div>
        )}

        {selected && mode === 'edit' && (
          <div style={{ padding: '28px 36px', maxWidth: 720 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <Avatar name={selected.name} size={44} photo={selected.profilePhoto} />
              <div>
                <h2 style={{ fontFamily: UI_COLORS.serif, fontSize: 26, fontWeight: 300 }}>{waiver ? 'Edit Waiver' : 'New Client Waiver'}</h2>
                <div style={{ fontSize: 12, color: UI_COLORS.fgMuted, marginTop: 3 }}>{selected.name} · {DateUtil.format(DateUtil.today(), 'medium')}</div>
              </div>
            </div>

            {/* Practice info block */}
            <div style={{ background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`, padding: '16px 20px', marginBottom: 28 }}>
              <div style={{ fontFamily: UI_COLORS.serif, fontSize: 18, marginBottom: 6 }}>Krystle <em style={{ fontStyle:'italic', color: UI_COLORS.pink }}>&amp; Co</em> — Client Consent &amp; Waiver</div>
              <p style={{ fontSize: 12, color: UI_COLORS.fgMuted, lineHeight: 1.8 }}>
                By completing and signing this form, the client acknowledges they have read, understood, and agree to the terms below regarding lash extension services, refund policy, and health disclosures. All information is kept confidential and stored securely.
              </p>
            </div>

            {/* Medical History */}
            <Section title="Medical History" color={UI_COLORS.pink}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <CheckBox label="I wear contact lenses" checked={form.contactLenses} onChange={v => set('contactLenses', v)} />
                <CheckBox label="I have had eye surgery (LASIK, etc.)" checked={form.eyeSurgery} onChange={v => set('eyeSurgery', v)} />
                <CheckBox label="I have glaucoma or eye pressure issues" checked={form.glaucoma} onChange={v => set('glaucoma', v)} color={UI_COLORS.yellow} />
                <CheckBox label="I have dry eyes" checked={form.dryEyes} onChange={v => set('dryEyes', v)} />
                <CheckBox label="I have eye allergies / sensitive eyes" checked={form.eyeAllergy} onChange={v => set('eyeAllergy', v)} color={UI_COLORS.yellow} />
                <CheckBox label="I am currently pregnant" checked={form.pregnant} onChange={v => set('pregnant', v)} color={UI_COLORS.yellow} />
                <CheckBox label="I am undergoing chemotherapy or radiation" checked={form.chemotherapy} onChange={v => set('chemotherapy', v)} color={UI_COLORS.red} />
                <CheckBox label="I have had a previous reaction to lash extensions" checked={form.previousReaction} onChange={v => set('previousReaction', v)} color={UI_COLORS.red} />
              </div>
              {form.previousReaction && (
                <Field label="Please describe the reaction" style={{ marginTop: 12 }}>
                  <Input value={form.previousReactionDetails} onChange={v => set('previousReactionDetails', v)} placeholder="Redness, swelling, itching…" />
                </Field>
              )}
              <Field label="Skin conditions (if any)" style={{ marginTop: 16 }}>
                <Input value={form.skinConditions} onChange={v => set('skinConditions', v)} placeholder="Eczema, psoriasis, rosacea, none…" />
              </Field>
              <Field label="Current medications (if any)" style={{ marginTop: 12 }}>
                <Input value={form.medications} onChange={v => set('medications', v)} placeholder="Blood thinners, Accutane, none…" />
              </Field>
            </Section>

            {/* Allergy Disclosures */}
            <Section title="Allergy Disclosures" color={UI_COLORS.red}>
              <CheckBox label="I have a latex allergy" checked={form.latexAllergy} onChange={v => set('latexAllergy', v)} color={UI_COLORS.red} />
              <CheckBox label="I have an adhesive / cyanoacrylate allergy" checked={form.adhesiveAllergy} onChange={v => set('adhesiveAllergy', v)} color={UI_COLORS.red} />
              <CheckBox label="I have a formaldehyde sensitivity" checked={form.formaldehydeAllergy} onChange={v => set('formaldehydeAllergy', v)} color={UI_COLORS.red} />
              <Field label="Other allergies or sensitivities" style={{ marginTop: 12 }}>
                <Input value={form.otherAllergies} onChange={v => set('otherAllergies', v)} placeholder="List any others…" />
              </Field>
            </Section>

            {/* No Refund Policy */}
            <Section title="No Refund Policy" color={UI_COLORS.yellow}>
              <div style={{ background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.yellow}33`, padding: '16px 18px', marginBottom: 16, lineHeight: 1.9, fontSize: 13, color: UI_COLORS.fgMuted }}>
                <p style={{ marginBottom: 10 }}>
                  <strong style={{ color: UI_COLORS.fg }}>All sales are final.</strong> Due to the nature of lash extension services, <strong style={{ color: UI_COLORS.fg }}>no refunds will be issued</strong> once a service has been performed.
                </p>
                <p style={{ marginBottom: 10 }}>
                  If you are unhappy with your results, please contact us within <strong style={{ color: UI_COLORS.fg }}>48 hours</strong> of your appointment for a complimentary adjustment. Adjustments are offered at our discretion and are not guaranteed.
                </p>
                <p>
                  Cancellations made <strong style={{ color: UI_COLORS.fg }}>less than 24 hours</strong> before a scheduled appointment will forfeit any deposit paid. No-shows forfeit the deposit in full.
                </p>
              </div>
              <CheckBox
                label="I have read and agree to the No Refund Policy"
                checked={form.refundPolicyAgreed}
                onChange={v => set('refundPolicyAgreed', v)}
                color={UI_COLORS.yellow}
              />
            </Section>

            {/* Consent */}
            <Section title="Informed Consent" color={UI_COLORS.green}>
              <div style={{ background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`, padding: '16px 18px', marginBottom: 16, lineHeight: 1.9, fontSize: 13, color: UI_COLORS.fgMuted }}>
                <p style={{ marginBottom: 10 }}>
                  I understand that lash extension services involve the application of individual lash extensions using a semi-permanent adhesive. I acknowledge the following:
                </p>
                <ul style={{ paddingLeft: 20, marginBottom: 10 }}>
                  <li>Reactions, though rare, can occur — including redness, swelling, or irritation.</li>
                  <li>A patch test is recommended for first-time clients and those with sensitivities.</li>
                  <li>I am responsible for disclosing any health conditions that may affect service.</li>
                  <li>I grant permission for before/after photos to be used for portfolio purposes (unless declined below).</li>
                </ul>
              </div>
              <CheckBox label="I consent to the lash extension service and the terms above" checked={form.consentAgreed} onChange={v => set('consentAgreed', v)} color={UI_COLORS.green} />
              <CheckBox label="I decline permission for before/after photos" checked={form.noPhotos} onChange={v => set('noPhotos', v)} color={UI_COLORS.fgMuted} />
            </Section>

            {/* Signature */}
            <Section title="Signature" color={UI_COLORS.pink}>
              <p style={{ fontSize: 12, color: UI_COLORS.fgMuted, marginBottom: 14 }}>
                Type your full legal name below to sign this waiver electronically.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <Field label="Full Name (electronic signature)">
                  <input
                    value={form.signature || ''}
                    onChange={e => set('signature', e.target.value)}
                    placeholder={selected.name}
                    style={{ background: UI_COLORS.bg3, border: `2px solid ${form.signature ? UI_COLORS.pink : UI_COLORS.border}`, color: UI_COLORS.fg, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontStyle: 'italic', fontWeight: 400, padding: '10px 14px', outline: 'none', width: '100%', transition: 'border-color 0.2s' }}
                  />
                </Field>
                <Field label="Date">
                  <Input type="date" value={form.signedDate} onChange={v => set('signedDate', v)} />
                </Field>
              </div>
            </Section>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8, paddingBottom: 40 }}>
              <Btn variant="ghost" onClick={() => setMode('view')}>Cancel</Btn>
              <Btn onClick={handleSave} disabled={!form.signature?.trim()}>Save &amp; Sign Waiver</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
window.WaiversView = WaiversView;
