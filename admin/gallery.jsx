// Gallery Admin View
function GalleryView({ data, refresh }) {
  const { useState, useRef, useEffect } = React;
  const { clients, appointments } = data;
  const [photos, setPhotos] = useState(() => Store.photos.all());
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const [editPhoto, setEditPhoto] = useState(null); // photo being edited
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({ clientId: '', appointmentId: '', caption: '', tag: 'After', featured: false });
  const [staged, setStaged] = useState([]); // files waiting to upload
  const fileRef = useRef();

  const refreshPhotos = () => setPhotos(Store.photos.all());
  const getClient = id => clients.find(c => c.id === id);
  const getAppt = id => appointments.find(a => a.id === id);
  const clientAppts = form.clientId ? appointments.filter(a => a.clientId === form.clientId).sort((a,b) => a.date > b.date ? -1 : 1) : [];

  // Stage files for preview (no upload yet)
  const stageFiles = (files) => {
    const newStaged = Array.from(files).filter(f => f.type.startsWith('image/')).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setStaged(prev => [...prev, ...newStaged]);
  };

  const removeStaged = (idx) => setStaged(prev => prev.filter((_, i) => i !== idx));

  // Actually upload staged files
  const handleUpload = async () => {
    if (staged.length === 0) return;
    setUploading(true);
    for (const { file } of staged) {
      const dataUrl = await Store.compressImage(file, 1200, 0.8);
      Store.photos.save({
        dataUrl,
        clientId: form.clientId || null,
        appointmentId: form.appointmentId || null,
        caption: form.caption || '',
        tag: form.tag,
        featured: form.featured,
        fileName: file.name,
      });
    }
    refreshPhotos();
    setStaged([]);
    setUploading(false);
    setForm(f => ({ ...f, caption: '', appointmentId: '' }));
  };

  const toggleFeatured = (id) => {
    Store.photos.toggleFeatured(id);
    refreshPhotos();
  };

  const deletePhoto = (id) => {
    if (!window.confirm('Delete this photo?')) return;
    Store.photos.delete(id);
    refreshPhotos();
    if (lightbox?.id === id) setLightbox(null);
    if (editPhoto?.id === id) setEditPhoto(null);
  };

  const openEdit = (photo) => {
    setEditPhoto(photo);
    setEditForm({ caption: photo.caption || '', tag: photo.tag || 'After', clientId: photo.clientId || '', appointmentId: photo.appointmentId || '', featured: photo.featured || false });
    setLightbox(null);
  };

  const saveEditPhoto = () => {
    Store.photos.save({ ...editPhoto, ...editForm });
    refreshPhotos();
    setEditPhoto(null);
  };

  const filtered = filter === 'featured' ? photos.filter(p => p.featured) : photos;
  const featuredCount = photos.filter(p => p.featured).length;

  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);

  const filteredClients = clientSearch.length > 0
    ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

  const selectClient = (c) => {
    setForm(f => ({ ...f, clientId: c.id, appointmentId: '' }));
    setClientSearch(c.name);
    setShowClientList(false);
  };

  const clearClient = () => {
    setForm(f => ({ ...f, clientId: '', appointmentId: '' }));
    setClientSearch('');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-client-search]')) setShowClientList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const TAGS = ['After', 'Before', 'Before & After', 'Detail', 'Studio'];

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 6 }}>Media</div>
          <h1 style={{ fontFamily: UI_COLORS.serif, fontSize: 36, fontWeight: 300 }}>
            Gallery <em style={{ fontStyle: 'italic', color: UI_COLORS.pink }}>&amp; Photos</em>
          </h1>
        </div>
        <div style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>
          <span style={{ color: UI_COLORS.green, fontFamily: UI_COLORS.serif, fontSize: 20 }}>{featuredCount}</span> featured on website · {photos.length} total
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 28, alignItems: 'start' }}>

        {/* Upload Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); stageFiles(e.dataTransfer.files); }}
            style={{
              border: `2px dashed ${UI_COLORS.border}`, padding: '32px 20px', textAlign: 'center',
              cursor: 'pointer', transition: 'border-color 0.2s',
              background: staged.length > 0 ? UI_COLORS.pink + '08' : 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = UI_COLORS.pink}
            onMouseLeave={e => e.currentTarget.style.borderColor = UI_COLORS.border}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => stageFiles(e.target.files)} />
            <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 13, color: UI_COLORS.fg, marginBottom: 4 }}>
              Drop photos or click to select
            </div>
            <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>JPG, PNG · Auto-compressed on upload</div>
          </div>

          {/* Staged preview */}
          {staged.length > 0 && (
            <div style={{ background: UI_COLORS.bg3, border: `1px solid ${UI_COLORS.border}`, padding: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 12 }}>
                {staged.length} photo{staged.length !== 1 ? 's' : ''} ready to upload
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {staged.map((s, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={s.preview} alt={s.name}
                      style={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => removeStaged(i)}
                      style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: UI_COLORS.red, border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <Btn onClick={handleUpload} disabled={uploading} style={{ width: '100%', justifyContent: 'center' }}>
                {uploading ? 'Uploading…' : `Upload ${staged.length} Photo${staged.length !== 1 ? 's' : ''}`}
              </Btn>
            </div>
          )}

          {/* Photo metadata */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '20px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 16 }}>Tag Upload With</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Client (optional)">
                <div style={{ position: 'relative' }} data-client-search="1">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={clientSearch}
                      onChange={e => { setClientSearch(e.target.value); setShowClientList(true); if (!e.target.value) clearClient(); }}
                      onFocus={() => setShowClientList(true)}
                      placeholder="Search by name…"
                      style={{ flex: 1, background: UI_COLORS.bg3, border: `1px solid ${form.clientId ? UI_COLORS.pink + '55' : UI_COLORS.border}`, color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 13, fontWeight: 300, padding: '8px 12px', outline: 'none' }}
                    />
                    {form.clientId && (
                      <button onClick={clearClient} style={{ background: 'transparent', border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fgMuted, cursor: 'pointer', padding: '0 10px', fontSize: 13 }}>✕</button>
                    )}
                  </div>
                  {/* Dropdown list */}
                  {showClientList && (clientSearch || filteredClients.length > 0) && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`,
                      maxHeight: 200, overflowY: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}>
                      <div onClick={() => { clearClient(); setShowClientList(false); }}
                        style={{ padding: '10px 14px', fontSize: 12, color: UI_COLORS.fgMuted, cursor: 'pointer', borderBottom: `1px solid ${UI_COLORS.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = UI_COLORS.bg3}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        No client tag
                      </div>
                      {filteredClients.map(c => (
                        <div key={c.id} onClick={() => selectClient(c)}
                          style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', background: form.clientId === c.id ? UI_COLORS.pink + '18' : 'transparent', color: form.clientId === c.id ? UI_COLORS.pink : UI_COLORS.fg }}
                          onMouseEnter={e => { if (form.clientId !== c.id) e.currentTarget.style.background = UI_COLORS.bg3; }}
                          onMouseLeave={e => { if (form.clientId !== c.id) e.currentTarget.style.background = 'transparent'; }}>
                          {c.name}
                        </div>
                      ))}
                      {filteredClients.length === 0 && (
                        <div style={{ padding: '10px 14px', fontSize: 12, color: UI_COLORS.fgMuted }}>No clients found</div>
                      )}
                    </div>
                  )}
                </div>
              </Field>
              {clientAppts.length > 0 && (
                <Field label="Appointment (optional)">
                  <SelectInput value={form.appointmentId} onChange={v => setForm(f => ({ ...f, appointmentId: v }))}
                    options={[{ value: '', label: 'No appointment tag' }, ...clientAppts.map(a => ({ value: a.id, label: `${a.service} · ${DateUtil.format(a.date, 'short')}` }))]} />
                </Field>
              )}
              <Field label="Photo Type">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TAGS.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tag: t }))} style={{
                      padding: '5px 12px', fontSize: 11, cursor: 'pointer',
                      background: form.tag === t ? UI_COLORS.pink + '22' : 'transparent',
                      border: `1px solid ${form.tag === t ? UI_COLORS.pink + '55' : UI_COLORS.border}`,
                      color: form.tag === t ? UI_COLORS.pink : UI_COLORS.fgMuted,
                    }}>{t}</button>
                  ))}
                </div>
              </Field>
              <Field label="Caption (optional)">
                <Input value={form.caption} onChange={v => setForm(f => ({ ...f, caption: v }))} placeholder="e.g. Wispy hybrid set…" />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
                  style={{ width: 18, height: 18, border: `1px solid ${form.featured ? UI_COLORS.pink : UI_COLORS.border}`, background: form.featured ? UI_COLORS.pink : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {form.featured && <span style={{ color: UI_COLORS.bg, fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>Feature on website</span>
              </label>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        <div>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${UI_COLORS.border}` }}>
            {[['all', `All (${photos.length})`], ['featured', `Featured (${featuredCount})`]].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} style={{
                padding: '8px 20px', background: 'none', border: 'none',
                borderBottom: filter === id ? `2px solid ${UI_COLORS.pink}` : '2px solid transparent',
                color: filter === id ? UI_COLORS.pink : UI_COLORS.fgMuted,
                fontFamily: UI_COLORS.sans, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: 'pointer', marginBottom: -1,
              }}>{label}</button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: UI_COLORS.fgMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🖼</div>
              <p>No photos yet — upload your first one!</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[...filtered].sort((a,b) => (b.createdAt || '') > (a.createdAt || '') ? 1 : -1).map(photo => {
              const client = photo.clientId ? getClient(photo.clientId) : null;
              return (
                <div key={photo.id} style={{ position: 'relative', group: true }}>
                  {/* Image */}
                  <div style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                    onClick={() => setLightbox(photo)}>
                    <img src={photo.dataUrl} alt={photo.caption || photo.tag}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    {/* Featured badge */}
                    {photo.featured && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: UI_COLORS.pink, color: UI_COLORS.bg, fontSize: 9, letterSpacing: '0.15em', padding: '3px 8px', textTransform: 'uppercase' }}>
                        Featured
                      </div>
                    )}
                    {/* Tag */}
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, letterSpacing: '0.12em', padding: '3px 8px', textTransform: 'uppercase' }}>
                      {photo.tag}
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ padding: '10px 0 6px' }}>
                    {photo.caption && <div style={{ fontSize: 12, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.caption}</div>}
                    {client && <div style={{ fontSize: 10, color: UI_COLORS.pink, marginBottom: 2 }}>{client.name}</div>}
                    <div style={{ fontSize: 10, color: UI_COLORS.fgDim }}>{photo.createdAt ? DateUtil.format(photo.createdAt, 'short') : '—'}</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => toggleFeatured(photo.id)} style={{
                      flex: 1, padding: '5px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                      background: photo.featured ? UI_COLORS.pink + '22' : 'transparent',
                      border: `1px solid ${photo.featured ? UI_COLORS.pink + '55' : UI_COLORS.border}`,
                      color: photo.featured ? UI_COLORS.pink : UI_COLORS.fgMuted,
                    }}>{photo.featured ? '★ Featured' : '☆ Feature'}</button>
                    <button onClick={() => openEdit(photo)} style={{ padding: '5px 8px', background: 'transparent', border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fgMuted, cursor: 'pointer', fontSize: 11 }} title="Edit">✎</button>
                    <button onClick={() => deletePhoto(photo.id)} style={{ padding: '5px 8px', background: 'transparent', border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.red, cursor: 'pointer', fontSize: 11 }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Photo Modal */}
      {editPhoto && (() => {
        const editClientAppts = editForm.clientId ? appointments.filter(a => a.clientId === editForm.clientId).sort((a,b) => a.date > b.date ? -1 : 1) : [];
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => e.target === e.currentTarget && setEditPhoto(null)}>
            <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${UI_COLORS.border}`, position: 'sticky', top: 0, background: UI_COLORS.bg2, zIndex: 1 }}>
                <span style={{ fontFamily: UI_COLORS.serif, fontSize: 22, fontWeight: 300 }}>Edit Photo</span>
                <button onClick={() => setEditPhoto(null)} style={{ background: 'none', border: 'none', color: UI_COLORS.fgMuted, cursor: 'pointer', fontSize: 20 }}>×</button>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Preview */}
                <img src={editPhoto.dataUrl} alt={editPhoto.tag} style={{ width: '100%', maxHeight: 240, objectFit: 'contain', background: UI_COLORS.bg3 }} />

                {/* Fields */}
                <Field label="Caption">
                  <Input value={editForm.caption} onChange={v => setEditForm(f => ({ ...f, caption: v }))} placeholder="e.g. Wispy hybrid set…" />
                </Field>

                <Field label="Photo Type">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TAGS.map(t => (
                      <button key={t} onClick={() => setEditForm(f => ({ ...f, tag: t }))} style={{
                        padding: '5px 12px', fontSize: 11, cursor: 'pointer',
                        background: editForm.tag === t ? UI_COLORS.pink + '22' : 'transparent',
                        border: `1px solid ${editForm.tag === t ? UI_COLORS.pink + '55' : UI_COLORS.border}`,
                        color: editForm.tag === t ? UI_COLORS.pink : UI_COLORS.fgMuted,
                      }}>{t}</button>
                    ))}
                  </div>
                </Field>

                <Field label="Client">
                  <SelectInput
                    value={editForm.clientId}
                    onChange={v => setEditForm(f => ({ ...f, clientId: v, appointmentId: '' }))}
                    options={[{ value: '', label: 'No client tag' }, ...clients.map(c => ({ value: c.id, label: c.name }))]}
                  />
                </Field>

                {editClientAppts.length > 0 && (
                  <Field label="Appointment">
                    <SelectInput
                      value={editForm.appointmentId}
                      onChange={v => setEditForm(f => ({ ...f, appointmentId: v }))}
                      options={[{ value: '', label: 'No appointment tag' }, ...editClientAppts.map(a => ({ value: a.id, label: `${a.service} · ${DateUtil.format(a.date, 'short')}` }))]}
                    />
                  </Field>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div onClick={() => setEditForm(f => ({ ...f, featured: !f.featured }))}
                    style={{ width: 18, height: 18, border: `1px solid ${editForm.featured ? UI_COLORS.pink : UI_COLORS.border}`, background: editForm.featured ? UI_COLORS.pink : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {editForm.featured && <span style={{ color: UI_COLORS.bg, fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>Feature on website</span>
                </label>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 8 }}>
                  <Btn variant="danger" size="sm" onClick={() => deletePhoto(editPhoto.id)}>Delete Photo</Btn>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn variant="ghost" onClick={() => setEditPhoto(null)}>Cancel</Btn>
                    <Btn onClick={saveEditPhoto}>Save Changes</Btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setLightbox(null)}>
          <div style={{ position: 'relative', maxWidth: '80vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.dataUrl} alt={lightbox.caption} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {lightbox.caption && <div style={{ fontSize: 14, marginBottom: 4 }}>{lightbox.caption}</div>}
                {lightbox.clientId && <div style={{ fontSize: 12, color: UI_COLORS.pink, marginBottom: 2 }}>{getClient(lightbox.clientId)?.name}</div>}
                <div style={{ fontSize: 11, color: UI_COLORS.fgDim }}>{lightbox.createdAt ? DateUtil.format(lightbox.createdAt, 'medium') : ''}</div>
              </div>
              <button onClick={() => openEdit(lightbox)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', marginRight: 8 }}>Edit</button>
              <button onClick={() => toggleFeatured(lightbox.id)} style={{
                padding: '8px 16px', background: lightbox.featured ? UI_COLORS.pink : 'transparent',
                border: `1px solid ${lightbox.featured ? UI_COLORS.pink : UI_COLORS.border}`,
                color: lightbox.featured ? UI_COLORS.bg : UI_COLORS.fg,
                fontFamily: UI_COLORS.sans, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
              }}>
                {lightbox.featured ? '★ Featured on Site' : '☆ Feature on Site'}
              </button>
            </div>
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: UI_COLORS.fgMuted, fontSize: 28, cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}
window.GalleryView = GalleryView;
