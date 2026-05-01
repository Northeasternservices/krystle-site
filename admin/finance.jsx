// Finance View — Revenue analytics
function FinanceView({ data }) {
  const { useState, useMemo } = React;
  const { appointments, clients, services } = data;
  const today = DateUtil.today();
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [expenses, setExpenses] = useState(() => Store.expenses.all());
  const [newExp, setNewExp] = useState({ description: '', amount: '', category: 'Rent', date: today });
  const [editingExp, setEditingExp] = useState(null);

  const refreshExpenses = () => setExpenses(Store.expenses.all());

  const EXPENSE_CATS = ['Rent', 'Supplies', 'Lash Products', 'Brow Products', 'Equipment', 'Marketing', 'Insurance', 'Education', 'Other'];

  const monthExpenses = useMemo(() => expenses.filter(e => e.date.slice(0,7) === selectedMonth), [expenses, selectedMonth]);
  const totalExpenses = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0); // YYYY-MM

  // ── Helpers ──────────────────────────────────────────────────────────────
  const completed = appointments.filter(a => a.status !== 'cancelled');

  const monthAppts = useMemo(() =>
    completed.filter(a => a.date.slice(0, 7) === selectedMonth),
    [selectedMonth, appointments]
  );

  // All months that have appointments
  const allMonths = useMemo(() => {
    const months = [...new Set(completed.map(a => a.date.slice(0, 7)))].sort().reverse();
    if (!months.includes(today.slice(0, 7))) months.unshift(today.slice(0, 7));
    return months;
  }, [appointments]);

  const monthRevenue = monthAppts.reduce((s, a) => s + (Number(a.price) || 0), 0);
  const monthCount = monthAppts.length;
  const avgTicket = monthCount > 0 ? Math.round(monthRevenue / monthCount) : 0;

  // Revenue by service
  const byService = useMemo(() => {
    const map = {};
    monthAppts.forEach(a => {
      if (!map[a.service]) map[a.service] = { count: 0, revenue: 0 };
      map[a.service].count++;
      map[a.service].revenue += Number(a.price) || 0;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [monthAppts]);

  // Revenue by category
  const byCategory = useMemo(() => {
    const svcMap = {};
    services.forEach(s => { svcMap[s.name] = s.category; });
    const map = {};
    monthAppts.forEach(a => {
      const cat = svcMap[a.service] || 'Other';
      if (!map[cat]) map[cat] = { count: 0, revenue: 0 };
      map[cat].count++;
      map[cat].revenue += Number(a.price) || 0;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [monthAppts, services]);

  // Top clients this month
  const topClients = useMemo(() => {
    const map = {};
    monthAppts.forEach(a => {
      if (!map[a.clientId]) map[a.clientId] = { count: 0, revenue: 0 };
      map[a.clientId].count++;
      map[a.clientId].revenue += Number(a.price) || 0;
    });
    return Object.entries(map)
      .map(([id, v]) => ({ client: clients.find(c => c.id === id), ...v }))
      .filter(r => r.client)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [monthAppts, clients]);

  // Revenue by day of week
  const byDayOfWeek = useMemo(() => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const map = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 };
    const countMap = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 };
    monthAppts.forEach(a => {
      const d = new Date(a.date + 'T12:00:00');
      const key = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
      map[key] += Number(a.price) || 0;
      countMap[key]++;
    });
    return days.map(d => ({ day: d, revenue: map[d], count: countMap[d] }));
  }, [monthAppts]);

  // Month-over-month comparison (last 6 months)
  const monthTrend = useMemo(() => {
    return allMonths.slice(0, 6).reverse().map(m => {
      const appts = completed.filter(a => a.date.slice(0, 7) === m);
      const revenue = appts.reduce((s, a) => s + (Number(a.price) || 0), 0);
      const label = new Date(m + '-15').toLocaleDateString('en-US', { month: 'short' });
      return { month: m, label, revenue, count: appts.length };
    });
  }, [appointments]);

  const maxTrendRevenue = Math.max(...monthTrend.map(m => m.revenue), 1);
  const maxDayRevenue = Math.max(...byDayOfWeek.map(d => d.revenue), 1);
  const maxServiceRevenue = Math.max(...byService.map(s => s.revenue), 1);

  const catColors = [UI_COLORS.pink, 'oklch(0.65 0.16 200)', 'oklch(0.70 0.14 145)', 'oklch(0.75 0.12 280)', 'oklch(0.72 0.15 30)'];

  const formatMonth = (m) => new Date(m + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ── Stat Card ─────────────────────────────────────────────────────────────
  const StatCard = ({ label, value, sub, color = UI_COLORS.pink, prefix = '' }) => (
    <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px 28px' }}>
      <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: UI_COLORS.fgMuted, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: UI_COLORS.serif, fontSize: 44, fontWeight: 300, color, lineHeight: 1 }}>{prefix}{value}</div>
      {sub && <div style={{ fontSize: 11, color: UI_COLORS.fgMuted, marginTop: 8 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 6 }}>Analytics</div>
          <h1 style={{ fontFamily: UI_COLORS.serif, fontSize: 36, fontWeight: 300 }}>
            Finance <em style={{ fontStyle: 'italic', color: UI_COLORS.pink }}>&amp; Revenue</em>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.fgMuted }}>Viewing</span>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.fg, fontFamily: UI_COLORS.sans, fontSize: 13, padding: '8px 14px', cursor: 'pointer', outline: 'none' }}>
            {allMonths.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 32 }}>
        <StatCard label="Total Revenue" value={`$${monthRevenue.toLocaleString()}`} sub={formatMonth(selectedMonth)} color={UI_COLORS.green} />
        <StatCard label="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} sub="costs this month" color={UI_COLORS.red} />
        <StatCard label="Net Profit" value={`$${(monthRevenue - totalExpenses).toLocaleString()}`} sub="revenue minus costs" color={(monthRevenue - totalExpenses) >= 0 ? UI_COLORS.green : UI_COLORS.red} />
        <StatCard label="Appointments" value={monthCount} sub="completed" color={UI_COLORS.fg} />
        <StatCard label="Avg Ticket" value={`$${avgTicket}`} sub="per appointment" color={UI_COLORS.pink} />
      </div>

      {/* Revenue Trend + Day of Week */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Monthly Trend Bar Chart */}
        <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 24 }}>Revenue Trend (Last 6 Months)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
            {monthTrend.map(m => {
              const pct = m.revenue / maxTrendRevenue;
              const isSelected = m.month === selectedMonth;
              return (
                <div key={m.month} onClick={() => setSelectedMonth(m.month)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, color: isSelected ? UI_COLORS.pink : UI_COLORS.fgMuted }}>${m.revenue}</div>
                  <div style={{ width: '100%', position: 'relative', height: 100, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%', height: `${Math.max(pct * 100, 4)}%`,
                      background: isSelected ? UI_COLORS.pink : UI_COLORS.pink + '44',
                      transition: 'height 0.4s ease, background 0.2s',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: isSelected ? UI_COLORS.pink : UI_COLORS.fgMuted }}>{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day of Week */}
        <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 20 }}>Revenue by Day</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byDayOfWeek.map(d => (
              <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 28, fontSize: 10, color: UI_COLORS.fgMuted, letterSpacing: '0.1em' }}>{d.day}</span>
                <div style={{ flex: 1, height: 6, background: UI_COLORS.bg3, borderRadius: 0 }}>
                  <div style={{ width: `${d.revenue / maxDayRevenue * 100}%`, height: '100%', background: UI_COLORS.pink, transition: 'width 0.4s' }} />
                </div>
                <span style={{ width: 36, fontSize: 11, textAlign: 'right', color: d.revenue > 0 ? UI_COLORS.fg : UI_COLORS.fgDim }}>${d.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Breakdown + Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 24 }}>

        {/* By Service */}
        <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}` }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${UI_COLORS.border}`, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink }}>Revenue by Service</span>
            <span style={{ fontSize: 10, color: UI_COLORS.fgMuted }}>{formatMonth(selectedMonth)}</span>
          </div>
          {byService.length === 0 && <div style={{ padding: 24, color: UI_COLORS.fgMuted, fontSize: 13 }}>No data for this month</div>}
          {byService.map((svc, i) => (
            <div key={svc.name} style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 80px 90px',
              padding: '14px 24px', borderBottom: `1px solid ${UI_COLORS.border}22`,
              alignItems: 'center', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 13, marginBottom: 6 }}>{svc.name}</div>
                <div style={{ height: 3, background: UI_COLORS.bg3, width: '100%' }}>
                  <div style={{ width: `${svc.revenue / maxServiceRevenue * 100}%`, height: '100%', background: UI_COLORS.pink + '88', transition: 'width 0.4s' }} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: UI_COLORS.fgMuted, textAlign: 'center' }}>{svc.count}×</div>
              <div style={{ fontSize: 13, color: UI_COLORS.green, textAlign: 'right', fontFamily: UI_COLORS.serif }}>${svc.revenue}</div>
              <div style={{ fontSize: 11, color: UI_COLORS.fgMuted, textAlign: 'right' }}>
                {monthRevenue > 0 ? Math.round(svc.revenue / monthRevenue * 100) : 0}% of total
              </div>
            </div>
          ))}
        </div>

        {/* By Category + Top Clients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Category */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 20 }}>By Category</div>
            {byCategory.length === 0 && <div style={{ color: UI_COLORS.fgMuted, fontSize: 13 }}>No data</div>}
            {byCategory.map((cat, i) => (
              <div key={cat.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: catColors[i % catColors.length] }}>{cat.name}</span>
                  <span style={{ fontSize: 12, color: UI_COLORS.fg }}>${cat.revenue}</span>
                </div>
                <div style={{ height: 4, background: UI_COLORS.bg3 }}>
                  <div style={{
                    width: `${monthRevenue > 0 ? cat.revenue / monthRevenue * 100 : 0}%`,
                    height: '100%', background: catColors[i % catColors.length],
                    transition: 'width 0.4s',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: UI_COLORS.fgDim, marginTop: 3 }}>
                  {cat.count} appt{cat.count !== 1 ? 's' : ''} · {monthRevenue > 0 ? Math.round(cat.revenue / monthRevenue * 100) : 0}%
                </div>
              </div>
            ))}
          </div>

          {/* Top Clients */}
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}` }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
              <span style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink }}>Top Clients</span>
            </div>
            {topClients.length === 0 && <div style={{ padding: 20, color: UI_COLORS.fgMuted, fontSize: 13 }}>No data</div>}
            {topClients.map((r, i) => (
              <div key={r.client.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px',
                borderBottom: `1px solid ${UI_COLORS.border}22`,
              }}>
                <span style={{ fontSize: 11, color: UI_COLORS.fgDim, width: 14 }}>#{i+1}</span>
                <Avatar name={r.client.name} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.client.name}</div>
                  <div style={{ fontSize: 10, color: UI_COLORS.fgMuted }}>{r.count} visit{r.count !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontSize: 14, color: UI_COLORS.green, fontFamily: UI_COLORS.serif }}>${r.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Add Expense */}
        <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 20 }}>
            Add Expense
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Description">
              <Input value={editingExp ? editingExp.description : newExp.description}
                onChange={v => editingExp ? setEditingExp(e => ({...e, description: v})) : setNewExp(e => ({...e, description: v}))}
                placeholder="e.g. Monthly rent, lash adhesive…" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Amount ($)">
                <Input type="number" value={editingExp ? editingExp.amount : newExp.amount}
                  onChange={v => editingExp ? setEditingExp(e => ({...e, amount: v})) : setNewExp(e => ({...e, amount: v}))} />
              </Field>
              <Field label="Date">
                <Input type="date" value={editingExp ? editingExp.date : newExp.date}
                  onChange={v => editingExp ? setEditingExp(e => ({...e, date: v})) : setNewExp(e => ({...e, date: v}))} />
              </Field>
            </div>
            <Field label="Category">
              <SelectInput
                value={editingExp ? editingExp.category : newExp.category}
                onChange={v => editingExp ? setEditingExp(e => ({...e, category: v})) : setNewExp(e => ({...e, category: v}))}
                options={EXPENSE_CATS.map(c => ({ value: c, label: c }))} />
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {editingExp ? (
                <>
                  <Btn onClick={() => { Store.expenses.save(editingExp); refreshExpenses(); setEditingExp(null); }}>Save Changes</Btn>
                  <Btn variant="ghost" onClick={() => setEditingExp(null)}>Cancel</Btn>
                </>
              ) : (
                <Btn onClick={() => {
                  if (!newExp.description || !newExp.amount) return;
                  Store.expenses.save(newExp);
                  refreshExpenses();
                  setNewExp({ description: '', amount: '', category: 'Rent', date: today });
                }}>+ Add Expense</Btn>
              )}
            </div>
          </div>
        </div>

        {/* Expense List */}
        <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}` }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${UI_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink }}>
              Expenses — {formatMonth(selectedMonth)}
            </span>
            <span style={{ fontSize: 13, color: UI_COLORS.red, fontFamily: UI_COLORS.serif }}>−${totalExpenses}</span>
          </div>
          {monthExpenses.length === 0 && (
            <div style={{ padding: '24px 20px', color: UI_COLORS.fgMuted, fontSize: 13 }}>No expenses logged for this month</div>
          )}
          {[...monthExpenses].sort((a,b) => a.date > b.date ? -1 : 1).map(exp => (
            <div key={exp.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
              borderBottom: `1px solid ${UI_COLORS.border}22`,
            }}>
              <div style={{ width: 4, alignSelf: 'stretch', background: UI_COLORS.red + '66', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, marginBottom: 2 }}>{exp.description}</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 10, color: UI_COLORS.pink, letterSpacing: '0.1em' }}>{exp.category}</span>
                  <span style={{ fontSize: 10, color: UI_COLORS.fgDim }}>{DateUtil.format(exp.date, 'short')}</span>
                </div>
              </div>
              <div style={{ fontSize: 15, color: UI_COLORS.red, fontFamily: UI_COLORS.serif }}>−${Number(exp.amount).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn size="sm" variant="ghost" onClick={() => setEditingExp({...exp})}>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => { Store.expenses.delete(exp.id); refreshExpenses(); }}>✕</Btn>
              </div>
            </div>
          ))}
          {/* Profit summary */}
          {monthExpenses.length > 0 && (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${UI_COLORS.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: UI_COLORS.fgMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Net Profit</span>
              <span style={{ fontSize: 18, fontFamily: UI_COLORS.serif, color: (monthRevenue - totalExpenses) >= 0 ? UI_COLORS.green : UI_COLORS.red }}>
                ${(monthRevenue - totalExpenses).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expenses by Category */}
      {monthExpenses.length > 0 && (() => {
        const catMap = {};
        monthExpenses.forEach(e => {
          if (!catMap[e.category]) catMap[e.category] = 0;
          catMap[e.category] += Number(e.amount) || 0;
        });
        const catList = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
        const maxCat = Math.max(...catList.map(c => c[1]), 1);
        return (
          <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, padding: '24px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 20 }}>Expenses by Category</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {catList.map(([cat, amt]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12 }}>{cat}</span>
                    <span style={{ fontSize: 12, color: UI_COLORS.red }}>−${amt}</span>
                  </div>
                  <div style={{ height: 4, background: UI_COLORS.bg3 }}>
                    <div style={{ width: `${amt/maxCat*100}%`, height: '100%', background: UI_COLORS.red + '88' }} />
                  </div>
                  <div style={{ fontSize: 10, color: UI_COLORS.fgDim, marginTop: 3 }}>
                    {totalExpenses > 0 ? Math.round(amt/totalExpenses*100) : 0}% of expenses
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* All Appointments Table */}
      <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`, marginBottom: 24 }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${UI_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.pink }}>All Appointments — {formatMonth(selectedMonth)}</span>
          <span style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{monthCount} total · ${monthRevenue} revenue</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px 80px 100px', padding: '10px 24px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
          {['Date','Client','Service','Time','Revenue','Status'].map(h => (
            <span key={h} style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.fgDim }}>{h}</span>
          ))}
        </div>
        {monthAppts.length === 0 && <div style={{ padding: '24px', color: UI_COLORS.fgMuted, fontSize: 13 }}>No appointments this month</div>}
        {[...monthAppts].sort((a,b) => a.date > b.date ? 1 : -1).map(appt => {
          const client = clients.find(c => c.id === appt.clientId);
          return (
            <div key={appt.id} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 1fr 80px 80px 100px',
              padding: '12px 24px', borderBottom: `1px solid ${UI_COLORS.border}22`,
              alignItems: 'center', fontSize: 13,
            }}>
              <span style={{ color: UI_COLORS.fgMuted, fontSize: 12 }}>{DateUtil.format(appt.date, 'short')}</span>
              <span>{client?.name || '—'}</span>
              <span style={{ color: UI_COLORS.fgMuted, fontSize: 12 }}>{appt.service}</span>
              <span style={{ color: UI_COLORS.fgMuted, fontSize: 12 }}>{DateUtil.formatTime(appt.time)}</span>
              <span style={{ color: UI_COLORS.green, fontFamily: UI_COLORS.serif }}>${appt.price}</span>
              <Badge status={appt.status} />
            </div>
          );
        })}
      </div>

    </div>
  );
}
window.FinanceView = FinanceView;
