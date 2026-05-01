// ─────────────────────────────────────────────────────────────────────────────
// Krystle & Co — Admin Data Store
// Uses localStorage by default (works offline, single device).
// To sync across devices, fill in your Supabase credentials below.
// Get them free at https://supabase.com → New Project → Settings → API
// ─────────────────────────────────────────────────────────────────────────────

const KC_SUPABASE = {
  url: '',   // e.g. 'https://abcdef.supabase.co'
  key: '',   // your anon/public key
};

// ─── Date helpers ────────────────────────────────────────────────────────────
const DateUtil = {
  today() { return new Date().toISOString().slice(0, 10); },
  addDays(dateStr, n) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  },
  startOfWeek(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay(); // 0=Sun
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return monday.toISOString().slice(0, 10);
  },
  daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); },
  firstDayOfMonth(year, month) {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // 0=Mon
  },
  format(dateStr, style = 'medium') {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    if (style === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (style === 'medium') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (style === 'long') return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (style === 'monthyear') return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return dateStr;
  },
  formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  },
  isToday(dateStr) { return dateStr === DateUtil.today(); },
  isPast(dateStr) { return dateStr < DateUtil.today(); },
};

// ─── Sample seed data ─────────────────────────────────────────────────────────
const SEED = {
  clients: [
    { id: 'c1', name: 'Emma Rodriguez', phone: '508-555-0101', email: 'emma@example.com', birthday: '1992-03-15', notes: 'Prefers wispy hybrid, D curl. Sensitive outer corners.', allergies: 'None known', patchTest: '2025-11-10', referral: 'Instagram', totalSpent: 420, createdAt: '2025-09-01' },
    { id: 'c2', name: 'Sophia Chen', phone: '508-555-0102', email: 'sophia@example.com', birthday: '1988-07-22', notes: 'Loves mega volume, goes bold every time.', allergies: 'Latex sensitivity — use latex-free tape', patchTest: '2025-10-05', referral: 'Friend referral', totalSpent: 680, createdAt: '2025-08-15' },
    { id: 'c3', name: 'Olivia Walsh', phone: '508-555-0103', email: 'olivia@example.com', birthday: '1995-12-01', notes: 'Classic set only, very natural look. Short natural lashes.', allergies: 'None', patchTest: '2026-01-20', referral: 'Facebook', totalSpent: 310, createdAt: '2026-01-15' },
    { id: 'c4', name: 'Mia Torres', phone: '508-555-0104', email: 'mia@example.com', birthday: '1990-05-18', notes: 'Lash lift regular. Interested in brow lamination next visit.', allergies: 'None', patchTest: '2025-09-12', referral: 'Google', totalSpent: 240, createdAt: '2025-07-01' },
    { id: 'c5', name: 'Ava Patel', phone: '508-555-0105', email: 'ava@example.com', birthday: '1997-08-30', notes: 'New client. First timer — extra consultation time needed.', allergies: 'Tree nut allergy (not relevant)', patchTest: '2026-02-14', referral: 'Instagram', totalSpent: 145, createdAt: '2026-02-14' },
    { id: 'c6', name: 'Lily Park', phone: '508-555-0106', email: 'lily@example.com', birthday: '1993-11-07', notes: 'Brow henna + classic lashes combo. Very happy with bold brow look.', allergies: 'None', patchTest: '2026-03-01', referral: 'Word of mouth', totalSpent: 390, createdAt: '2026-03-01' },
  ],
  appointments: [
    { id: 'a1', clientId: 'c1', service: 'Hybrid Full Set', date: '2026-04-25', time: '09:00', duration: 120, price: 155, status: 'confirmed', notes: 'Wispy D curl effect' },
    { id: 'a2', clientId: 'c2', service: 'Volume Fill', date: '2026-04-25', time: '13:00', duration: 90, price: 95, status: 'confirmed', notes: '' },
    { id: 'a3', clientId: 'c6', service: 'Brow Henna', date: '2026-04-25', time: '15:30', duration: 60, price: 75, status: 'confirmed', notes: 'Go slightly darker this time' },
    { id: 'a4', clientId: 'c3', service: 'Classic Full Set', date: '2026-04-28', time: '11:00', duration: 120, price: 130, status: 'confirmed', notes: 'Natural look' },
    { id: 'a5', clientId: 'c4', service: 'Lash Lift & Tint', date: '2026-04-29', time: '14:00', duration: 60, price: 85, status: 'confirmed', notes: '' },
    { id: 'a6', clientId: 'c5', service: 'Classic Full Set', date: '2026-04-30', time: '10:30', duration: 120, price: 130, status: 'pending', notes: 'First timer — thorough consult' },
    { id: 'a7', clientId: 'c1', service: 'Hybrid Fill', date: '2026-05-05', time: '10:00', duration: 75, price: 85, status: 'confirmed', notes: '' },
    { id: 'a8', clientId: 'c2', service: 'Volume Full Set', date: '2026-05-06', time: '14:00', duration: 150, price: 175, status: 'confirmed', notes: '' },
    { id: 'a9', clientId: 'c3', service: 'Brow Lamination', date: '2026-05-07', time: '11:00', duration: 60, price: 95, status: 'confirmed', notes: '' },
    { id: 'a10', clientId: 'c6', service: 'Classic Fill', date: '2026-05-09', time: '09:30', duration: 60, price: 65, status: 'confirmed', notes: '' },
  ],
  services: [
    { id: 's1', category: 'Lash Extensions', name: 'Classic Full Set', price: 130, duration: 120 },
    { id: 's2', category: 'Lash Extensions', name: 'Classic Fill', price: 65, duration: 60 },
    { id: 's3', category: 'Lash Extensions', name: 'Hybrid Full Set', price: 155, duration: 120 },
    { id: 's4', category: 'Lash Extensions', name: 'Hybrid Fill', price: 85, duration: 75 },
    { id: 's5', category: 'Lash Extensions', name: 'Volume Full Set', price: 175, duration: 150 },
    { id: 's6', category: 'Lash Extensions', name: 'Volume Fill', price: 95, duration: 90 },
    { id: 's7', category: 'Lash Lifts', name: 'Lash Lift & Tint', price: 85, duration: 60 },
    { id: 's8', category: 'Lash Lifts', name: 'Lash Lift Only', price: 70, duration: 45 },
    { id: 's9', category: 'Brows', name: 'Brow Henna', price: 75, duration: 60 },
    { id: 's10', category: 'Brows', name: 'Brow Lamination', price: 95, duration: 60 },
    { id: 's11', category: 'Brows', name: 'Brow Lamination + Tint', price: 115, duration: 75 },
  ],
  messages: [],
};

// ─── Password hashing (SHA-256 via Web Crypto) ────────────────────────────────
const Auth = {
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'kc_salt_2026');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  },
  async verifyPassword(password, hash) {
    const h = await Auth.hashPassword(password);
    return h === hash;
  },
  // Client session
  setSession(clientId) { sessionStorage.setItem('kc_client', clientId); },
  getSession() { return sessionStorage.getItem('kc_client'); },
  clearSession() { sessionStorage.removeItem('kc_client'); },
};
window.Auth = Auth;
const Store = (() => {
  const KEY = 'kc_admin_v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // First run — seed data
    const data = JSON.parse(JSON.stringify(SEED));
    save(data);
    return data;
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function get() { return load(); }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // ── Clients ──
  const clients = {
    all() { return load().clients; },
    get(id) { return load().clients.find(c => c.id === id); },
    save(client) {
      const data = load();
      const idx = data.clients.findIndex(c => c.id === client.id);
      if (idx >= 0) data.clients[idx] = client;
      else data.clients.push({ ...client, id: uid(), createdAt: DateUtil.today() });
      save(data);
    },
    delete(id) {
      const data = load();
      data.clients = data.clients.filter(c => c.id !== id);
      save(data);
    },
  };

  // ── Appointments ──
  const appointments = {
    all() { return load().appointments; },
    get(id) { return load().appointments.find(a => a.id === id); },
    forDate(date) { return load().appointments.filter(a => a.date === date); },
    forClient(clientId) { return load().appointments.filter(a => a.clientId === clientId).sort((a,b) => a.date > b.date ? -1 : 1); },
    async save(appt) {
      const data = load();
      // Auto-create client profile for online bookings with no clientId
      let clientId = appt.clientId;
      if (!clientId && appt.clientName) {
        const existing = data.clients.find(c =>
          c.email && appt.clientEmail && c.email.toLowerCase() === appt.clientEmail.toLowerCase()
        );
        if (existing) {
          clientId = existing.id;
        } else {
          const newClient = {
            id: uid(),
            name: appt.clientName,
            phone: appt.clientPhone || '',
            email: appt.clientEmail || '',
            passwordHash: appt.clientPassword || null,
            birthday: '',
            notes: appt.notes || '',
            allergies: '',
            patchTest: '',
            referral: 'Online Booking',
            totalSpent: 0,
            createdAt: DateUtil.today(),
          };
          data.clients.push(newClient);
          clientId = newClient.id;
          save(data);
        }
      }
      const finalAppt = { ...appt, clientId };

      // Try API first
      try {
        if (finalAppt.id) {
          // Update existing
          const res = await fetch(`https://api.krystleandco.com/api/appointments/${finalAppt.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalAppt),
          });
          if (res.ok) {
            const updated = await res.json();
            // Merge API response back into localStorage
            const idx = data.appointments.findIndex(a => a.id === finalAppt.id);
            const merged = { ...finalAppt, ...updated };
            if (idx >= 0) data.appointments[idx] = merged;
            else data.appointments.push(merged);
            save(data);
            return merged;
          }
        } else {
          // Create new
          const res = await fetch('https://api.krystleandco.com/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalAppt),
          });
          if (res.ok) {
            const created = await res.json();
            const merged = { ...finalAppt, ...created };
            data.appointments.push(merged);
            save(data);
            // Update client totalSpent
            if (merged.status === 'completed' && merged.clientId) {
              const clientAppts = data.appointments.filter(a => a.clientId === merged.clientId && a.status === 'completed');
              const total = clientAppts.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
              const ci = data.clients.findIndex(c => c.id === merged.clientId);
              if (ci >= 0) { data.clients[ci].totalSpent = total; save(data); }
            }
            return merged;
          }
        }
      } catch (e) {
        console.warn('API unavailable, falling back to localStorage:', e.message);
      }

      // Fallback: localStorage only
      const idx = data.appointments.findIndex(a => a.id === finalAppt.id);
      if (idx >= 0) data.appointments[idx] = finalAppt;
      else data.appointments.push({ ...finalAppt, id: uid() });
      save(data);
      if (appt.status === 'completed' && appt.clientId) {
        const clientAppts = data.appointments.filter(a => a.clientId === appt.clientId && a.status === 'completed');
        const total = clientAppts.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
        const ci = data.clients.findIndex(c => c.id === appt.clientId);
        if (ci >= 0) { data.clients[ci].totalSpent = total; save(data); }
      }
    },
    delete(id) {
      const data = load();
      data.appointments = data.appointments.filter(a => a.id !== id);
      save(data);
      // Also delete from API
      fetch(`https://api.krystleandco.com/api/appointments/${id}`, { method: 'DELETE' }).catch(() => {});
    },
  };

  // ── Services ──
  const services = {
    all() { return load().services; },
    async save(svc) {
      const data = load();
      const isNew = !svc.id;
      const localSvc = isNew ? { ...svc, id: uid() } : svc;

      // Optimistically save locally first
      const idx = data.services.findIndex(s => s.id === localSvc.id);
      if (idx >= 0) data.services[idx] = localSvc;
      else data.services.push(localSvc);
      save(data);

      const cfg = settings.get();
      const depositPct = cfg.depositPercent || 50;
      const depositAmt = Math.round(localSvc.price * depositPct / 100);

      // Try API — PATCH existing, POST new
      try {
        const url = isNew
          ? 'https://api.krystleandco.com/api/admin/services'
          : `https://api.krystleandco.com/api/admin/services/${localSvc.id}`;
        const method = isNew ? 'POST' : 'PATCH';
        const res = await fetch(url, {
          method,
          headers: adminHeaders(),
          body: JSON.stringify({
            name: localSvc.name,
            price: localSvc.price,
            deposit_amount: depositAmt,
            duration_minutes: localSvc.duration,
            category: localSvc.category,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          // Merge API response — backend may return numeric id; keep local string id too
          const fresh = load();
          const fi = fresh.services.findIndex(s => s.id === localSvc.id);
          const merged = { ...localSvc, ...updated, id: localSvc.id };
          if (fi >= 0) fresh.services[fi] = merged;
          else fresh.services.push(merged);
          // Sync Stripe links into settings if backend returned them
          if (updated.stripeDepositLink || updated.stripeFullLink) {
            const s = fresh.settings || cfg;
            if (!s.stripeLinks) s.stripeLinks = {};
            s.stripeLinks[merged.id] = {
              depositLink: updated.stripeDepositLink || s.stripeLinks[merged.id]?.depositLink || '',
              fullLink: updated.stripeFullLink || s.stripeLinks[merged.id]?.fullLink || '',
              autoGenerated: true,
              lastUpdated: new Date().toISOString(),
            };
            fresh.settings = s;
          }
          save(fresh);
          return { ok: true, data: merged };
        } else {
          const errText = await res.text().catch(() => res.status);
          console.warn('Services API error:', res.status, errText);
          return { ok: false, apiError: true, data: localSvc };
        }
      } catch (e) {
        // API unavailable — local save already done
        console.warn('Services API unavailable:', e.message);
        return { ok: false, offline: true, data: localSvc };
      }
    },
    delete(id) {
      const data = load();
      data.services = data.services.filter(s => s.id !== id);
      save(data);
      fetch(`https://api.krystleandco.com/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      }).catch(() => {});
    },
  };

  // ── Messages — API-backed (https://api.krystleandco.com) ──
  const messages = {
    async all() {
      try {
        const res = await fetch('https://api.krystleandco.com/api/messages');
        if (!res.ok) throw new Error();
        const apiMsgs = await res.json();
        const localMsgs = load().messages || [];
        // Merge: prefer API data, supplement with any local-only messages
        const apiIds = new Set(apiMsgs.map(m => m.id));
        const localOnly = localMsgs.filter(m => !apiIds.has(m.id));
        return [...apiMsgs, ...localOnly].sort((a,b) => a.sentAt > b.sentAt ? 1 : -1);
      } catch {
        return load().messages || [];
      }
    },
    async forClient(clientId) {
      try {
        const res = await fetch(`https://api.krystleandco.com/api/messages/${clientId}`);
        if (!res.ok) throw new Error();
        const apiMsgs = await res.json();
        const localMsgs = (load().messages || []).filter(m => m.clientId === clientId);
        const apiIds = new Set(apiMsgs.map(m => m.id));
        const localOnly = localMsgs.filter(m => !apiIds.has(m.id));
        return [...apiMsgs, ...localOnly].sort((a,b) => a.sentAt > b.sentAt ? 1 : -1);
      } catch {
        return (load().messages || []).filter(m => m.clientId === clientId).sort((a,b) => a.sentAt > b.sentAt ? 1 : -1);
      }
    },
    unreadCount() {
      return (load().messages || []).filter(m => m.direction === 'inbound' && !m.read).length;
    },
    markRead(id) {
      const data = load();
      const idx = (data.messages || []).findIndex(m => m.id === id);
      if (idx >= 0) { data.messages[idx].read = true; save(data); }
    },
    async send(payload) {
      // payload: { to, body, clientId, type }
      try {
        const res = await fetch('https://api.krystleandco.com/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        // fallback: log locally
        const data = load();
        if (!data.messages) data.messages = [];
        data.messages.push({ ...payload, id: uid(), direction: 'outbound', sentAt: new Date().toISOString(), status: 'sent (local fallback)' });
        save(data);
      }
    },
    // Legacy sync log — kept for backwards compat
    log(msg) {
      const data = load();
      if (!data.messages) data.messages = [];
      data.messages.push({ ...msg, id: uid(), sentAt: new Date().toISOString(), direction: msg.direction || 'outbound' });
      save(data);
    },
    logInbound(from, body) {
      const data = load();
      if (!data.messages) data.messages = [];
      const phone = from.replace(/\D/g,'');
      const client = data.clients.find(c => c.phone && c.phone.replace(/\D/g,'') === phone);
      data.messages.push({ id: uid(), direction: 'inbound', from, body, clientId: client?.id || null, clientName: client?.name || from, sentAt: new Date().toISOString(), read: false });
      save(data);
    },
  };

  // ── Expenses ──
  const expenses = {
    all() { return load().expenses || []; },
    forMonth(month) { return (load().expenses || []).filter(e => e.date.slice(0,7) === month); },
    save(exp) {
      const data = load();
      if (!data.expenses) data.expenses = [];
      const idx = data.expenses.findIndex(e => e.id === exp.id);
      if (idx >= 0) data.expenses[idx] = exp;
      else data.expenses.push({ ...exp, id: uid() });
      save(data);
    },
    delete(id) {
      const data = load();
      data.expenses = (data.expenses || []).filter(e => e.id !== id);
      save(data);
    },
  };

  // ── Settings ──
  const settings = {
    get() {
      const data = load();
      return data.settings || {
        depositPercent: 50,
        workingHours: { start: 9, end: 19 },
        stripePublishableKey: '',
        stripeLinks: {}, // serviceId -> { depositLink, fullLink }
        bookingBuffer: 60, // minutes between appointments
        adminApiToken: '', // Bearer token for api.krystleandco.com/api/admin/*
      };
    },
    save(s) {
      const data = load();
      data.settings = { ...settings.get(), ...s };
      save(data);
    },
  };

  // ── Admin API helpers ──
  function adminHeaders() {
    const token = settings.get().adminApiToken || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  // ── Photos ──
  const photos = {
    all() { return load().photos || []; },
    forClient(clientId) { return (load().photos || []).filter(p => p.clientId === clientId); },
    forAppointment(apptId) { return (load().photos || []).filter(p => p.appointmentId === apptId); },
    featured() { return (load().photos || []).filter(p => p.featured); },
    save(photo) {
      const data = load();
      if (!data.photos) data.photos = [];
      const idx = data.photos.findIndex(p => p.id === photo.id);
      if (idx >= 0) data.photos[idx] = photo;
      else data.photos.push({ ...photo, id: uid(), createdAt: DateUtil.today() });
      save(data);
    },
    delete(id) {
      const data = load();
      data.photos = (data.photos || []).filter(p => p.id !== id);
      save(data);
    },
    toggleFeatured(id) {
      const data = load();
      const idx = (data.photos || []).findIndex(p => p.id === id);
      if (idx >= 0) { data.photos[idx].featured = !data.photos[idx].featured; save(data); }
    },
  };

  // ── Availability (blocked dates & times) ──
  const availability = {
    get() {
      const data = load();
      return data.availability || {
        blockedDates: [],       // ['2026-05-01', …] full day blocks
        blockedRanges: [],      // [{id, date, start, end, reason}]
        recurringDaysOff: [0],  // 0=Sun always off by default
      };
    },
    save(avail) {
      const data = load();
      data.availability = avail;
      save(data);
    },
    isDateBlocked(dateStr) {
      const avail = availability.get();
      const d = new Date(dateStr + 'T12:00:00').getDay();
      if (avail.recurringDaysOff.includes(d)) return true;
      if (avail.blockedDates.includes(dateStr)) return true;
      return false;
    },
    isTimeBlocked(dateStr, timeStr) {
      const avail = availability.get();
      if (availability.isDateBlocked(dateStr)) return true;
      const [h, m] = timeStr.split(':').map(Number);
      const mins = h * 60 + m;
      return avail.blockedRanges.filter(r => r.date === dateStr).some(r => {
        const [sh, sm] = r.start.split(':').map(Number);
        const [eh, em] = r.end.split(':').map(Number);
        return mins >= sh * 60 + sm && mins < eh * 60 + em;
      });
    },
  };

  // ── Waivers ──
  const waivers = {
    all() { return load().waivers || []; },
    forClient(clientId) { return (load().waivers || []).find(w => w.clientId === clientId) || null; },
    save(waiver) {
      const data = load();
      if (!data.waivers) data.waivers = [];
      const idx = data.waivers.findIndex(w => w.clientId === waiver.clientId);
      if (idx >= 0) data.waivers[idx] = { ...waiver, updatedAt: DateUtil.today() };
      else data.waivers.push({ ...waiver, id: uid(), createdAt: DateUtil.today(), updatedAt: DateUtil.today() });
      save(data);
    },
    delete(clientId) {
      const data = load();
      data.waivers = (data.waivers || []).filter(w => w.clientId !== clientId);
      save(data);
    },
  };

  // Image compression utility
  async function compressImage(file, maxPx = 1200, quality = 0.75) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  return { get, clients, appointments, services, messages, expenses, settings, photos, waivers, availability, compressImage, DateUtil, uid };
})();

// Make globally available
window.Store = Store;
window.DateUtil = DateUtil;
