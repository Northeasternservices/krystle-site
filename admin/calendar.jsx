// Calendar View — Month / Week / Day / List
function CalendarView({ data, onNewAppt, onViewAppt }) {
  const { useState, useMemo } = React;
  const { appointments, clients } = data;

  const [mode, setMode] = useState('week');
  const [cursor, setCursor] = useState(DateUtil.today());
  const [showAvail, setShowAvail] = useState(false);
  const [avail, setAvail] = useState(() => Store.availability.get());
  const [blockForm, setBlockForm] = useState({ type: 'date', date: DateUtil.today(), start: '09:00', end: '17:00', reason: '' });

  const saveAvail = (next) => { Store.availability.save(next); setAvail(next); };

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const toggleRecurring = (day) => {
    const days = avail.recurringDaysOff.includes(day)
      ? avail.recurringDaysOff.filter(d => d !== day)
      : [...avail.recurringDaysOff, day];
    saveAvail({ ...avail, recurringDaysOff: days });
  };

  const addBlock = () => {
    if (blockForm.type === 'date') {
      if (avail.blockedDates.includes(blockForm.date)) return;
      saveAvail({ ...avail, blockedDates: [...avail.blockedDates, blockForm.date].sort() });
    } else {
      const range = { id: Store.uid(), date: blockForm.date, start: blockForm.start, end: blockForm.end, reason: blockForm.reason };
      saveAvail({ ...avail, blockedRanges: [...avail.blockedRanges, range] });
    }
    setBlockForm(f => ({ ...f, reason: '' }));
  };

  const removeDate = (date) => saveAvail({ ...avail, blockedDates: avail.blockedDates.filter(d => d !== date) });
  const removeRange = (id) => saveAvail({ ...avail, blockedRanges: avail.blockedRanges.filter(r => r.id !== id) });

  const isBlocked = (dateStr) => Store.availability.isDateBlocked(dateStr);

  const getClient = id => clients.find(c => c.id === id);

  const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am–8pm

  // ── Month View ──────────────────────────────────────────────────────────────
  function MonthView() {
    const d = new Date(cursor + 'T12:00:00');
    const year = d.getFullYear(), month = d.getMonth();
    const daysInMonth = DateUtil.daysInMonth(year, month);
    const firstDay = DateUtil.firstDayOfMonth(year, month); // 0=Mon
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);

    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: `1px solid ${UI_COLORS.border}` }}>
          {dayNames.map(d => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: UI_COLORS.fgMuted }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} style={{ minHeight: 100, borderRight: `1px solid ${UI_COLORS.border}`, borderBottom: `1px solid ${UI_COLORS.border}` }} />;
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
            const isToday = DateUtil.isToday(dateStr);
            return (
              <div key={day} onClick={() => { setCursor(dateStr); setMode('day'); }}
                style={{
                  minHeight: 100, padding: 8, cursor: 'pointer',
                  borderRight: `1px solid ${UI_COLORS.border}`, borderBottom: `1px solid ${UI_COLORS.border}`,
                  background: isToday ? UI_COLORS.pink + '0a' : 'transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => !isToday && (e.currentTarget.style.background = UI_COLORS.bg3)}
                onMouseLeave={e => !isToday && (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? UI_COLORS.pink : 'transparent',
                  color: isToday ? UI_COLORS.bg : UI_COLORS.fg,
                  fontSize: 13, marginBottom: 6, fontWeight: isToday ? 500 : 300,
                }}>{day}</div>
                {dayAppts.slice(0, 3).map(a => (
                  <div key={a.id} onClick={e => { e.stopPropagation(); onViewAppt(a); }}
                    style={{
                      fontSize: 10, padding: '2px 6px', marginBottom: 2,
                      background: UI_COLORS.pink + '22', color: UI_COLORS.pink,
                      borderLeft: `2px solid ${UI_COLORS.pink}`,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                    {DateUtil.formatTime(a.time)} {getClient(a.clientId)?.name?.split(' ')[0]}
                  </div>
                ))}
                {dayAppts.length > 3 && <div style={{ fontSize: 10, color: UI_COLORS.fgMuted }}>+{dayAppts.length-3} more</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Week View ───────────────────────────────────────────────────────────────
  function WeekView() {
    const weekStart = DateUtil.startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => DateUtil.addDays(weekStart, i));
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    return (
      <div style={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
        {/* Time axis */}
        <div style={{ width: 60, flexShrink: 0, borderRight: `1px solid ${UI_COLORS.border}` }}>
          <div style={{ height: 56 }} />
          {HOURS.map(h => (
            <div key={h} style={{ height: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10, paddingTop: 2 }}>
              <span style={{ fontSize: 10, color: UI_COLORS.fgDim }}>{h > 12 ? h-12 : h}{h >= 12 ? 'pm' : 'am'}</span>
            </div>
          ))}
        </div>
        {/* Day columns */}
        {days.map((dateStr, di) => {
          const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled').sort((a,b) => a.time > b.time ? 1 : -1);
          const isToday = DateUtil.isToday(dateStr);
          const d = new Date(dateStr + 'T12:00:00');
          return (
            <div key={dateStr} style={{ flex: 1, minWidth: 110, borderRight: `1px solid ${UI_COLORS.border}`, position: 'relative' }}>
              {/* Header */}
              <div style={{
                height: 56, borderBottom: `1px solid ${UI_COLORS.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                background: isToday ? UI_COLORS.pink + '10' : 'transparent',
              }}>
                <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: isToday ? UI_COLORS.pink : UI_COLORS.fgMuted }}>
                  {dayNames[di]}
                </span>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? UI_COLORS.pink : 'transparent',
                  color: isToday ? UI_COLORS.bg : UI_COLORS.fg, fontSize: 14,
                }}>{d.getDate()}</span>
              </div>
              {/* Hour cells */}
              {HOURS.map(h => (
                <div key={h} style={{ height: 60, borderBottom: `1px solid ${UI_COLORS.border}33`, position: 'relative' }}
                  onClick={() => { onNewAppt({ date: dateStr, time: `${String(h).padStart(2,'0')}:00` }); }}
                />
              ))}
              {/* Appointments */}
              {dayAppts.map(appt => {
                const [ah, am] = appt.time.split(':').map(Number);
                const topPx = 56 + (ah - 8) * 60 + (am / 60) * 60;
                const heightPx = Math.max(30, (appt.duration / 60) * 60 - 2);
                const client = getClient(appt.clientId);
                return (
                  <div key={appt.id} onClick={e => { e.stopPropagation(); onViewAppt(appt); }}
                    style={{
                      position: 'absolute', top: topPx, left: 2, right: 2, height: heightPx,
                      background: UI_COLORS.pink + '22', borderLeft: `3px solid ${UI_COLORS.pink}`,
                      padding: '3px 6px', overflow: 'hidden', cursor: 'pointer', zIndex: 2,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = UI_COLORS.pink + '33'}
                    onMouseLeave={e => e.currentTarget.style.background = UI_COLORS.pink + '22'}
                  >
                    <div style={{ fontSize: 10, fontWeight: 500, color: UI_COLORS.pink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {client?.name?.split(' ')[0]}
                    </div>
                    {heightPx > 40 && <div style={{ fontSize: 9, color: UI_COLORS.fgMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.service}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Day View ────────────────────────────────────────────────────────────────
  function DayView() {
    const dayAppts = appointments.filter(a => a.date === cursor && a.status !== 'cancelled').sort((a,b) => a.time > b.time ? 1 : -1);
    return (
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: 60, flexShrink: 0, borderRight: `1px solid ${UI_COLORS.border}` }}>
          <div style={{ height: 20 }} />
          {HOURS.map(h => (
            <div key={h} style={{ height: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10, paddingTop: 2 }}>
              <span style={{ fontSize: 10, color: UI_COLORS.fgDim }}>{h > 12 ? h-12 : h}{h >= 12 ? 'pm' : 'am'}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ height: 20 }} />
          {HOURS.map(h => <div key={h} style={{ height: 80, borderBottom: `1px solid ${UI_COLORS.border}33` }} />)}
          {dayAppts.map(appt => {
            const [ah, am] = appt.time.split(':').map(Number);
            const topPx = 20 + (ah - 8) * 80 + (am / 60) * 80;
            const heightPx = Math.max(40, (appt.duration / 60) * 80 - 3);
            const client = getClient(appt.clientId);
            return (
              <div key={appt.id} onClick={() => onViewAppt(appt)}
                style={{
                  position: 'absolute', top: topPx, left: 8, right: 8, height: heightPx,
                  background: UI_COLORS.pink + '20', borderLeft: `3px solid ${UI_COLORS.pink}`,
                  padding: '8px 12px', cursor: 'pointer', overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: 13, color: UI_COLORS.fg, marginBottom: 3 }}>{client?.name}</div>
                <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{appt.service} · {DateUtil.formatTime(appt.time)}</div>
                {heightPx > 60 && appt.notes && <div style={{ fontSize: 11, color: UI_COLORS.fgDim, marginTop: 4 }}>{appt.notes}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────────────
  function ListView() {
    const upcoming = appointments.filter(a => a.date >= DateUtil.today()).sort((a,b) => a.date > b.date || (a.date === b.date && a.time > b.time) ? 1 : -1);
    const grouped = {};
    upcoming.forEach(a => { if (!grouped[a.date]) grouped[a.date] = []; grouped[a.date].push(a); });
    return (
      <div style={{ padding: '0 24px 24px' }}>
        {Object.entries(grouped).map(([date, appts]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink, padding: '16px 0 10px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
              {DateUtil.format(date, 'medium')} {DateUtil.isToday(date) && '· Today'}
            </div>
            {appts.map(appt => {
              const client = getClient(appt.clientId);
              return (
                <div key={appt.id} onClick={() => onViewAppt(appt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                    borderBottom: `1px solid ${UI_COLORS.border}33`, cursor: 'pointer',
                  }}
                >
                  <Avatar name={client?.name} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{client?.name}</div>
                    <div style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>{appt.service} · {appt.duration} min</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 12 }}>
                    <div style={{ fontSize: 14, color: UI_COLORS.pink }}>{DateUtil.formatTime(appt.time)}</div>
                    <div style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>${appt.price}</div>
                  </div>
                  <Badge status={appt.status} />
                </div>
              );
            })}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: UI_COLORS.fgMuted }}>No upcoming appointments</div>
        )}
      </div>
    );
  }

  // Navigation helpers
  const navigate = (dir) => {
    if (mode === 'month') {
      const d = new Date(cursor + 'T12:00:00');
      d.setMonth(d.getMonth() + dir);
      setCursor(d.toISOString().slice(0, 10));
    } else if (mode === 'week') {
      setCursor(DateUtil.addDays(cursor, dir * 7));
    } else if (mode === 'day') {
      setCursor(DateUtil.addDays(cursor, dir));
    }
  };

  const title = mode === 'month' ? DateUtil.format(cursor, 'monthyear')
    : mode === 'week' ? `Week of ${DateUtil.format(DateUtil.startOfWeek(cursor), 'short')}`
    : mode === 'day' ? DateUtil.format(cursor, 'long')
    : 'Upcoming';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 28px', borderBottom: `1px solid ${UI_COLORS.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {mode !== 'list' && (
            <>
              <Btn variant="ghost" size="sm" onClick={() => navigate(-1)}>‹</Btn>
              <span style={{ fontFamily: UI_COLORS.serif, fontSize: 22, minWidth: 200 }}>{title}</span>
              <Btn variant="ghost" size="sm" onClick={() => navigate(1)}>›</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setCursor(DateUtil.today())}>Today</Btn>
            </>
          )}
          {mode === 'list' && <span style={{ fontFamily: UI_COLORS.serif, fontSize: 22 }}>All Upcoming</span>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['month','week','day','list'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '6px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: mode === m ? UI_COLORS.pink + '22' : 'transparent',
              border: mode === m ? `1px solid ${UI_COLORS.pink}44` : `1px solid ${UI_COLORS.border}`,
              color: mode === m ? UI_COLORS.pink : UI_COLORS.fgMuted,
              cursor: 'pointer',
            }}>{m}</button>
          ))}
          <Btn size="sm" onClick={() => onNewAppt({ date: cursor })} style={{ marginLeft: 8 }}>+ New</Btn>
          <Btn size="sm" variant="ghost" onClick={() => setShowAvail(true)} style={{ marginLeft: 4 }}>🗓 Availability</Btn>
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {mode === 'month' && <MonthView />}
        {mode === 'week' && <WeekView />}
        {mode === 'day' && <DayView />}
        {mode === 'list' && <ListView />}
      </div>
      {/* Availability Modal */}
      {showAvail && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => e.target === e.currentTarget && setShowAvail(false)}>
          <div style={{ background: UI_COLORS.bg2, border:`1px solid ${UI_COLORS.border}`, width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 40px 100px rgba(0,0,0,0.6)' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid ${UI_COLORS.border}`, position:'sticky', top:0, background:UI_COLORS.bg2, zIndex:1 }}>
              <span style={{ fontFamily:UI_COLORS.serif, fontSize:22, fontWeight:300 }}>Manage Availability</span>
              <button onClick={() => setShowAvail(false)} style={{ background:'none', border:'none', color:UI_COLORS.fgMuted, cursor:'pointer', fontSize:20 }}>×</button>
            </div>
            <div style={{ padding:24, display:'flex', flexDirection:'column', gap:24 }}>

              {/* Recurring days off */}
              <div>
                <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:UI_COLORS.pink, marginBottom:12 }}>Weekly Days Off</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {DAYS.map((d, i) => {
                    const on = avail.recurringDaysOff.includes(i);
                    return (
                      <button key={d} onClick={() => toggleRecurring(i)} style={{
                        padding:'7px 14px', fontSize:11, cursor:'pointer',
                        background: on ? UI_COLORS.red+'22' : 'transparent',
                        border:`1px solid ${on ? UI_COLORS.red+'55' : UI_COLORS.border}`,
                        color: on ? UI_COLORS.red : UI_COLORS.fgMuted,
                      }}>{d}</button>
                    );
                  })}
                </div>
                <div style={{ fontSize:11, color:UI_COLORS.fgDim, marginTop:8 }}>Red = day off every week. Clients cannot book on these days.</div>
              </div>

              {/* Add block */}
              <div style={{ background:UI_COLORS.bg3, border:`1px solid ${UI_COLORS.border}`, padding:20 }}>
                <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:UI_COLORS.pink, marginBottom:14 }}>Block a Date or Time Range</div>
                <div style={{ display:'flex', gap:0, marginBottom:14 }}>
                  {['date','range'].map((t,i) => (
                    <button key={t} onClick={() => setBlockForm(f => ({...f, type:t}))} style={{
                      flex:1, padding:'8px', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer',
                      background: blockForm.type===t ? UI_COLORS.pink+'22' : UI_COLORS.bg2,
                      border:`1px solid ${blockForm.type===t ? UI_COLORS.pink+'55' : UI_COLORS.border}`,
                      borderLeft: i===1 ? 'none' : undefined,
                      color: blockForm.type===t ? UI_COLORS.pink : UI_COLORS.fgMuted,
                    }}>{t==='date' ? 'Full Day' : 'Time Range'}</button>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <Field label="Date">
                    <Input type="date" value={blockForm.date} onChange={v => setBlockForm(f => ({...f, date:v}))} />
                  </Field>
                  {blockForm.type === 'range' && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <Field label="Start Time"><Input type="time" value={blockForm.start} onChange={v => setBlockForm(f => ({...f, start:v}))} /></Field>
                      <Field label="End Time"><Input type="time" value={blockForm.end} onChange={v => setBlockForm(f => ({...f, end:v}))} /></Field>
                    </div>
                  )}
                  <Field label="Reason (optional)">
                    <Input value={blockForm.reason} onChange={v => setBlockForm(f => ({...f, reason:v}))} placeholder="Vacation, personal, training…" />
                  </Field>
                  <Btn onClick={addBlock}>+ Add Block</Btn>
                </div>
              </div>

              {/* Blocked full days */}
              {avail.blockedDates.length > 0 && (
                <div>
                  <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:UI_COLORS.fgMuted, marginBottom:10 }}>Blocked Full Days</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {avail.blockedDates.map(date => (
                      <div key={date} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:UI_COLORS.bg3, border:`1px solid ${UI_COLORS.border}` }}>
                        <div>
                          <span style={{ fontSize:13 }}>{DateUtil.format(date, 'medium')}</span>
                          {DateUtil.isToday(date) && <span style={{ fontSize:10, color:UI_COLORS.pink, marginLeft:8 }}>Today</span>}
                        </div>
                        <button onClick={() => removeDate(date)} style={{ background:'transparent', border:`1px solid ${UI_COLORS.border}`, color:UI_COLORS.red, cursor:'pointer', fontSize:11, padding:'3px 8px' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocked time ranges */}
              {avail.blockedRanges.length > 0 && (
                <div>
                  <div style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:UI_COLORS.fgMuted, marginBottom:10 }}>Blocked Time Ranges</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {[...avail.blockedRanges].sort((a,b) => a.date > b.date ? 1 : -1).map(r => (
                      <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:UI_COLORS.bg3, border:`1px solid ${UI_COLORS.border}` }}>
                        <div>
                          <div style={{ fontSize:13 }}>{DateUtil.format(r.date,'medium')} · {DateUtil.formatTime(r.start)} – {DateUtil.formatTime(r.end)}</div>
                          {r.reason && <div style={{ fontSize:11, color:UI_COLORS.fgMuted, marginTop:2 }}>{r.reason}</div>}
                        </div>
                        <button onClick={() => removeRange(r.id)} style={{ background:'transparent', border:`1px solid ${UI_COLORS.border}`, color:UI_COLORS.red, cursor:'pointer', fontSize:11, padding:'3px 8px' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {avail.blockedDates.length === 0 && avail.blockedRanges.length === 0 && (
                <div style={{ textAlign:'center', padding:'16px', color:UI_COLORS.fgDim, fontSize:13 }}>No custom blocks yet — add a date or time range above.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.CalendarView = CalendarView;
