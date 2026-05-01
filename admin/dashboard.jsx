// Dashboard View
function Dashboard({ data, onNewAppt, onViewAppt }) {
  const { useState } = React;
  const { clients, appointments, services } = data;
  const today = DateUtil.today();

  const todayAppts = appointments.filter(a => a.date === today).sort((a,b) => a.time > b.time ? 1 : -1);
  const upcomingAppts = appointments.filter(a => a.date > today).sort((a,b) => a.date > b.date ? 1 : -1).slice(0, 5);
  const thisMonthAppts = appointments.filter(a => a.date.slice(0,7) === today.slice(0,7) && a.status !== 'cancelled');
  const monthRevenue = thisMonthAppts.reduce((s, a) => s + (Number(a.price) || 0), 0);
  const totalClients = clients.length;

  const getClient = id => clients.find(c => c.id === id);

  const StatCard = ({ label, value, sub, color = UI_COLORS.pink }) => (
    <div style={{
      background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}`,
      padding: '24px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <span style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: UI_COLORS.fgMuted }}>{label}</span>
      <span style={{ fontFamily: UI_COLORS.serif, fontSize: 40, fontWeight: 300, color, lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>{sub}</span>}
    </div>
  );

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: UI_COLORS.pink, marginBottom: 6 }}>
            {DateUtil.format(today, 'long')}
          </div>
          <h1 style={{ fontFamily: UI_COLORS.serif, fontSize: 36, fontWeight: 300 }}>
            Good morning, <em style={{ fontStyle: 'italic', color: UI_COLORS.pink }}>Krystle</em>
          </h1>
        </div>
        <Btn onClick={onNewAppt}>+ New Appointment</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 36 }}>
        <StatCard label="Today" value={todayAppts.length} sub={`appointment${todayAppts.length !== 1 ? 's' : ''}`} />
        <StatCard label="This Month" value={thisMonthAppts.length} sub="appointments" color={UI_COLORS.fg} />
        <StatCard label="Revenue (MTD)" value={`$${monthRevenue}`} sub="this month" color={UI_COLORS.green} />
        <StatCard label="Total Clients" value={totalClients} sub="in your book" color="oklch(0.72 0.12 280)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Today's Schedule */}
        <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}` }}>
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${UI_COLORS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink }}>Today's Schedule</span>
            <span style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{todayAppts.length} appt{todayAppts.length !== 1 ? 's' : ''}</span>
          </div>
          {todayAppts.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: UI_COLORS.fgMuted, fontSize: 13 }}>
              No appointments today ✨
            </div>
          ) : (
            todayAppts.map(appt => {
              const client = getClient(appt.clientId);
              return (
                <div key={appt.id}
                  onClick={() => onViewAppt(appt)}
                  style={{
                    padding: '14px 20px', borderBottom: `1px solid ${UI_COLORS.border}`,
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = UI_COLORS.bg3}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar name={client?.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{client?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: UI_COLORS.fgMuted }}>{appt.service}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: UI_COLORS.pink }}>{DateUtil.formatTime(appt.time)}</div>
                    <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{appt.duration} min</div>
                  </div>
                  <Badge status={appt.status} />
                </div>
              );
            })
          )}
        </div>

        {/* Upcoming */}
        <div style={{ background: UI_COLORS.bg2, border: `1px solid ${UI_COLORS.border}` }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${UI_COLORS.border}` }}>
            <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: UI_COLORS.pink }}>Upcoming</span>
          </div>
          {upcomingAppts.map(appt => {
            const client = getClient(appt.clientId);
            return (
              <div key={appt.id}
                onClick={() => onViewAppt(appt)}
                style={{
                  padding: '14px 20px', borderBottom: `1px solid ${UI_COLORS.border}`,
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = UI_COLORS.bg3}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar name={client?.name} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{client?.name}</div>
                  <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{appt.service}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: UI_COLORS.fg }}>{DateUtil.format(appt.date, 'short')}</div>
                  <div style={{ fontSize: 11, color: UI_COLORS.fgMuted }}>{DateUtil.formatTime(appt.time)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
window.Dashboard = Dashboard;
