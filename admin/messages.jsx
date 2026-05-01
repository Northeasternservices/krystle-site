// Messages / SMS View — Twilio integration UI
function MessagesView({ data, refresh }) {
  const { useState, useEffect } = React;
  const { clients, appointments } = data;

  const [messages, setMessages] = useState([]);
  const [threadMsgs, setThreadMsgs] = useState([]);
  const [tab, setTab] = useState('inbox');
  const [blastMsg, setBlastMsg] = useState('');
  const [blastTarget, setBlastTarget] = useState('all');
  const [customMsg, setCustomMsg] = useState('');
  const [customClient, setCustomClient] = useState('');
  const [sending, setSending] = useState(false);
  const [twilioOpen, setTwilioOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [simInbound, setSimInbound] = useState({ phone:'', body:'' });

  const [twilioConfig, setTwilioConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_twilio') || '{}'); } catch { return {}; }
  });
  const saveTwilio = (cfg) => { setTwilioConfig(cfg); localStorage.setItem('kc_twilio', JSON.stringify(cfg)); };

  // Load all messages from API
  const loadMessages = async () => {
    const msgs = await Store.messages.all();
    setMessages(msgs);
  };

  useEffect(() => { loadMessages(); }, []);

  // Poll for new messages every 15 seconds
  useEffect(() => {
    const interval = setInterval(loadMessages, 15000);
    return () => clearInterval(interval);
  }, []);

  const today = DateUtil.today();
  const tomorrow = DateUtil.addDays(today, 1);
  const tomorrowAppts = appointments.filter(a => a.date === tomorrow && a.status !== 'cancelled');
  const twoWeeksAgo = DateUtil.addDays(today, -14);
  const rebookCandidates = appointments.filter(a => {
    const diff = Math.abs(new Date(a.date) - new Date(twoWeeksAgo));
    return diff < 3 * 24 * 60 * 60 * 1000 && a.status === 'completed';
  });
  const thisMonth = today.slice(5, 7);
  const birthdayClients = clients.filter(c => c.birthday && c.birthday.slice(5, 7) === thisMonth);

  const getClient = id => clients.find(c => c.id === id);

  // Build conversation threads
  const threads = (() => {
    const map = {};
    messages.forEach(m => {
      const key = m.clientId || m.from || m.to || 'unknown';
      if (!map[key]) map[key] = { key, clientId: m.clientId, from: m.from, msgs: [], unread: 0 };
      map[key].msgs.push(m);
      if (m.direction === 'inbound' && !m.read) map[key].unread++;
    });
    return Object.values(map).sort((a, b) => {
      const aLast = a.msgs[a.msgs.length - 1]?.sentAt || '';
      const bLast = b.msgs[b.msgs.length - 1]?.sentAt || '';
      return bLast > aLast ? 1 : -1;
    });
  })();

  const unreadTotal = messages.filter(m => m.direction === 'inbound' && !m.read).length;

  const doSend = async (to, body, type, clientId) => {
    setSending(true);
    await Store.messages.send({ to, body, message: body, type, clientId: clientId || null, direction: 'outbound' });
    await loadMessages();
    setSending(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    const client = getClient(selectedThread);
    await doSend(client?.phone || selectedThread, replyText, 'reply', selectedThread);
    setReplyText('');
  };

  const sendReminder = async (appt) => {
    const client = getClient(appt.clientId);
    if (!client) return;
    const msg = `Hi ${client.name.split(' ')[0]}! Just a reminder — you have a ${appt.service} appointment tomorrow at ${DateUtil.formatTime(appt.time)} with Krystle & Co. See you then! ✨`;
    await doSend(client.phone, msg, 'reminder', client.id);
    alert('Reminder sent!');
  };

  const sendRebook = async (appt) => {
    const client = getClient(appt.clientId);
    if (!client) return;
    const msg = `Hi ${client.name.split(' ')[0]}! It's been about 2 weeks since your last visit — time for a fill? Book online 💕`;
    await doSend(client.phone, msg, 'rebook', client.id);
    alert('Rebook message sent!');
  };

  const sendBirthday = async (client) => {
    const msg = `Happy Birthday ${client.name.split(' ')[0]}! 🎂✨ Treat yourself — book online 💕 — Krystle & Co`;
    await doSend(client.phone, msg, 'birthday', client.id);
    alert('Birthday message sent!');
  };

  const sendBlast = async () => {
    const targets = blastTarget === 'all' ? clients : clients.filter(c => appointments.some(a => a.clientId === c.id && a.date >= today));
    if (!blastMsg.trim() || targets.length === 0) return;
    for (const c of targets) await doSend(c.phone, blastMsg, 'blast', c.id);
    alert(`Message sent to ${targets.length} clients!`);
    setBlastMsg('');
  };

  const sendCustom = async () => {
    const client = clients.find(c => c.id === customClient);
    if (!client || !customMsg.trim()) return;
    await doSend(client.phone, customMsg, 'custom', client.id);
    setCustomMsg(''); setCustomClient('');
    alert('Sent!');
  };

  const addSimInbound = () => {
    if (!simInbound.body.trim()) return;
    Store.messages.logInbound(simInbound.phone || '+15085550000', simInbound.body);
    setSimInbound({ phone:'', body:'' });
    loadMessages();
  };

  const openThread = (threadKey, clientId) => {
    setSelectedThread(threadKey);
    messages.filter(m => (m.clientId === clientId || m.from === threadKey) && m.direction === 'inbound' && !m.read)
      .forEach(m => Store.messages.markRead(m.id));
    loadMessages();
  };

  // Load thread messages for selected thread
  useEffect(() => {
    if (!selectedThread) { setThreadMsgs([]); return; }
    const thread = threads.find(t => t.key === selectedThread);
    if (!thread) return;
    if (thread.clientId) {
      Store.messages.forClient(thread.clientId).then(msgs => setThreadMsgs(msgs));
    } else {
      // filter locally by from/to
      setThreadMsgs(messages.filter(m => m.from === selectedThread || m.to === selectedThread || m.clientId === selectedThread));
    }
  }, [selectedThread, messages]);

  const TABS = [
    { id:'inbox', label: unreadTotal > 0 ? `Inbox (${unreadTotal})` : 'Inbox' },
    { id:'alerts', label:'Smart Alerts' },
    { id:'blast', label:'Broadcast' },
    { id:'history', label:'History' },
  ];

  const selectedThreadObj = threads.find(t => t.key === selectedThread);
  const threadClient = selectedThreadObj?.clientId ? getClient(selectedThreadObj.clientId) : null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ padding:'24px 32px 0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:'0.3em', textTransform:'uppercase', color:UI_COLORS.pink, marginBottom:6 }}>SMS & Alerts</div>
            <h1 style={{ fontFamily:UI_COLORS.serif, fontSize:36, fontWeight:300 }}>Messages</h1>
          </div>
          <Btn variant={twilioConfig.accountSid ? 'success' : 'ghost'} size="sm" onClick={() => setTwilioOpen(true)}>
            {twilioConfig.accountSid ? '✓ Twilio Connected' : '⚙ Connect Twilio'}
          </Btn>
        </div>

        {!twilioConfig.accountSid && (
          <div style={{ background:UI_COLORS.yellow+'12', border:`1px solid ${UI_COLORS.yellow}33`, padding:'12px 16px', marginBottom:16, fontSize:12, color:UI_COLORS.yellow }}>
            ⚠ Twilio not connected — messages are simulated. Connect Twilio to send real SMS.
          </div>
        )}

        <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${UI_COLORS.border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedThread(null); }} style={{
              padding:'10px 22px', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase',
              background:'transparent', border:'none',
              borderBottom: tab===t.id ? `2px solid ${UI_COLORS.pink}` : '2px solid transparent',
              color: tab===t.id ? UI_COLORS.pink : UI_COLORS.fgMuted,
              cursor:'pointer', marginBottom:-1,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 32px' }}>

        {/* ── INBOX / CONVERSATIONS ── */}
        {tab === 'inbox' && (
          <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:0, height:'100%', minHeight:400 }}>
            {/* Thread list */}
            <div style={{ borderRight:`1px solid ${UI_COLORS.border}`, overflowY:'auto' }}>
              <div style={{ fontSize:9, letterSpacing:'0.25em', textTransform:'uppercase', color:UI_COLORS.fgMuted, padding:'0 0 12px' }}>Conversations</div>

              {/* Simulate inbound (for demo / testing) */}
              {!twilioConfig.accountSid && (
                <div style={{ background:UI_COLORS.bg3, border:`1px solid ${UI_COLORS.border}`, padding:'12px', marginBottom:12 }}>
                  <div style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:UI_COLORS.fgMuted, marginBottom:8 }}>Simulate Incoming Text</div>
                  <SelectInput value={simInbound.phone} onChange={v => setSimInbound(f=>({...f, phone:v}))}
                    options={[{value:'',label:'Select client…'},...clients.map(c=>({value:c.phone||'',label:c.name}))]}
                    style={{ marginBottom:6, fontSize:12 }} />
                  <Input value={simInbound.body} onChange={v => setSimInbound(f=>({...f,body:v}))} placeholder="Client reply text…" style={{ marginBottom:6, fontSize:12 }} />
                  <Btn size="sm" onClick={addSimInbound} style={{ width:'100%', justifyContent:'center' }}>+ Add Reply</Btn>
                </div>
              )}

              {threads.length === 0 && (
                <div style={{ fontSize:13, color:UI_COLORS.fgMuted, padding:'20px 0' }}>No conversations yet — send a message to get started.</div>
              )}
              {threads.map(thread => {
                const client = thread.clientId ? getClient(thread.clientId) : null;
                const last = thread.msgs[thread.msgs.length - 1];
                const isSelected = selectedThread === thread.key;
                return (
                  <div key={thread.key} onClick={() => openThread(thread.key, thread.clientId)}
                    style={{ padding:'12px 12px 12px 0', borderBottom:`1px solid ${UI_COLORS.border}33`, cursor:'pointer', background:isSelected?UI_COLORS.pink+'0d':'transparent', transition:'background 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <Avatar name={client?.name || last?.from || '?'} size={36} />
                        {thread.unread > 0 && (
                          <div style={{ position:'absolute', top:-2, right:-2, width:14, height:14, borderRadius:'50%', background:UI_COLORS.pink, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:UI_COLORS.bg, fontWeight:700 }}>{thread.unread}</div>
                        )}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:13, fontWeight: thread.unread>0 ? 500 : 300 }}>{client?.name || last?.from || 'Unknown'}</span>
                          <span style={{ fontSize:10, color:UI_COLORS.fgDim }}>{last?.sentAt ? new Date(last.sentAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : ''}</span>
                        </div>
                        <div style={{ fontSize:11, color:UI_COLORS.fgMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {last?.direction==='inbound' ? '' : '↗ '}{last?.body || last?.message || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversation view */}
            <div style={{ display:'flex', flexDirection:'column', paddingLeft:24 }}>
              {!selectedThread ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:UI_COLORS.fgMuted, fontSize:13 }}>Select a conversation</div>
              ) : (
                <>
                  {/* Thread header */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:16, borderBottom:`1px solid ${UI_COLORS.border}`, marginBottom:16, flexShrink:0 }}>
                    <Avatar name={threadClient?.name || selectedThread} size={40} />
                    <div>
                      <div style={{ fontSize:15 }}>{threadClient?.name || selectedThread}</div>
                      <div style={{ fontSize:11, color:UI_COLORS.fgMuted }}>{threadClient?.phone}</div>
                    </div>
                    {threadClient && (
                      <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                        <div style={{ fontSize:11, color:UI_COLORS.fgMuted }}>
                          {(() => { const w = Store.waivers.forClient(threadClient.id); return w ? <span style={{color:UI_COLORS.green}}>✓ Waiver</span> : <span style={{color:UI_COLORS.red}}>⚠ No waiver</span>; })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                    {threadMsgs.length === 0 && <div style={{ fontSize:13, color:UI_COLORS.fgMuted }}>No messages in this thread yet.</div>}
                    {threadMsgs.map(msg => {
                      const isOut = msg.direction !== 'inbound';
                      return (
                        <div key={msg.id} style={{ display:'flex', justifyContent:isOut?'flex-end':'flex-start' }}>
                          <div style={{
                            maxWidth:'70%', padding:'10px 14px',
                            background: isOut ? UI_COLORS.pink+'22' : UI_COLORS.bg3,
                            border: `1px solid ${isOut ? UI_COLORS.pink+'44' : UI_COLORS.border}`,
                            borderRadius: isOut ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          }}>
                            <div style={{ fontSize:13, color:UI_COLORS.fg, lineHeight:1.6 }}>{msg.body || msg.message}</div>
                            <div style={{ fontSize:10, color:UI_COLORS.fgDim, marginTop:4, textAlign:isOut?'right':'left' }}>
                              {isOut ? '↗ Sent' : '↙ Received'} · {new Date(msg.sentAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply box */}
                  <div style={{ display:'flex', gap:8, flexShrink:0, borderTop:`1px solid ${UI_COLORS.border}`, paddingTop:16 }}>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder={`Reply to ${threadClient?.name || 'client'}… (Enter to send)`}
                      rows={2}
                      style={{ flex:1, background:UI_COLORS.bg3, border:`1px solid ${UI_COLORS.border}`, color:UI_COLORS.fg, fontFamily:UI_COLORS.sans, fontSize:13, fontWeight:300, padding:'10px 14px', outline:'none', resize:'none' }}
                    />
                    <Btn onClick={sendReply} disabled={sending || !replyText.trim()}>Send</Btn>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── SMART ALERTS ── */}
        {tab === 'alerts' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:700 }}>
            {/* 24hr Reminders */}
            <div style={{ background:UI_COLORS.bg2, border:`1px solid ${UI_COLORS.border}` }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${UI_COLORS.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:UI_COLORS.pink }}>24-Hour Reminders</div>
                  <div style={{ fontSize:12, color:UI_COLORS.fgMuted, marginTop:2 }}>Tomorrow's appointments — {tomorrowAppts.length} pending</div>
                </div>
                {tomorrowAppts.length > 0 && <Btn size="sm" variant="ghost" onClick={async () => { for (const a of tomorrowAppts) await sendReminder(a); }}>Send All</Btn>}
              </div>
              {tomorrowAppts.length === 0 && <div style={{ padding:'20px', color:UI_COLORS.fgMuted, fontSize:13 }}>No appointments tomorrow</div>}
              {tomorrowAppts.map(appt => {
                const client = getClient(appt.clientId);
                return (
                  <div key={appt.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:`1px solid ${UI_COLORS.border}33` }}>
                    <Avatar name={client?.name} size={34} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13 }}>{client?.name}</div>
                      <div style={{ fontSize:11, color:UI_COLORS.fgMuted }}>{appt.service} · {DateUtil.formatTime(appt.time)}</div>
                    </div>
                    <div style={{ fontSize:11, color:UI_COLORS.fgMuted }}>{client?.phone}</div>
                    <Btn size="sm" onClick={() => sendReminder(appt)} disabled={sending}>Send</Btn>
                  </div>
                );
              })}
            </div>

            {/* Rebooking */}
            <div style={{ background:UI_COLORS.bg2, border:`1px solid ${UI_COLORS.border}` }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${UI_COLORS.border}` }}>
                <div style={{ fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:UI_COLORS.pink }}>Rebooking Nudges</div>
                <div style={{ fontSize:12, color:UI_COLORS.fgMuted, marginTop:2 }}>Clients ~2 weeks past their last appointment</div>
              </div>
              {rebookCandidates.length === 0 && <div style={{ padding:'20px', color:UI_COLORS.fgMuted, fontSize:13 }}>No rebooking candidates right now</div>}
              {rebookCandidates.map(appt => {
                const client = getClient(appt.clientId);
                return (
                  <div key={appt.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:`1px solid ${UI_COLORS.border}33` }}>
                    <Avatar name={client?.name} size={34} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13 }}>{client?.name}</div>
                      <div style={{ fontSize:11, color:UI_COLORS.fgMuted }}>Last: {appt.service} on {DateUtil.format(appt.date,'short')}</div>
                    </div>
                    <Btn size="sm" onClick={() => sendRebook(appt)} disabled={sending}>Send Nudge</Btn>
                  </div>
                );
              })}
            </div>

            {/* Birthday */}
            <div style={{ background:UI_COLORS.bg2, border:`1px solid ${UI_COLORS.border}` }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${UI_COLORS.border}` }}>
                <div style={{ fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:UI_COLORS.pink }}>Birthday Messages</div>
                <div style={{ fontSize:12, color:UI_COLORS.fgMuted, marginTop:2 }}>Clients with birthdays this month</div>
              </div>
              {birthdayClients.length === 0 && <div style={{ padding:'20px', color:UI_COLORS.fgMuted, fontSize:13 }}>No birthdays this month</div>}
              {birthdayClients.map(client => (
                <div key={client.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:`1px solid ${UI_COLORS.border}33` }}>
                  <Avatar name={client.name} size={34} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13 }}>{client.name}</div>
                    <div style={{ fontSize:11, color:UI_COLORS.fgMuted }}>🎂 {DateUtil.format(client.birthday,'short')}</div>
                  </div>
                  <Btn size="sm" onClick={() => sendBirthday(client)} disabled={sending}>Send 🎂</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BROADCAST ── */}
        {tab === 'blast' && (
          <div style={{ maxWidth:560 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Field label="Send To">
                <SelectInput value={blastTarget} onChange={setBlastTarget} options={[
                  { value:'all', label:`All clients (${clients.length})` },
                  { value:'upcoming', label:'Clients with upcoming appointments' },
                ]} />
              </Field>
              <Field label="Message">
                <Textarea value={blastMsg} onChange={setBlastMsg} placeholder="Hi! I have a few openings this week — book online 💕" rows={5} />
                <div style={{ fontSize:11, color:UI_COLORS.fgDim, marginTop:4 }}>{blastMsg.length} characters</div>
              </Field>
              <Btn onClick={sendBlast} disabled={sending || !blastMsg.trim()}>
                {sending ? 'Sending…' : `Send to ${blastTarget==='all'?'All Clients':'Upcoming Clients'}`}
              </Btn>

              <div style={{ borderTop:`1px solid ${UI_COLORS.border}`, paddingTop:20 }}>
                <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:UI_COLORS.fgMuted, marginBottom:14 }}>Send to One Client</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <SelectInput value={customClient} onChange={setCustomClient} options={[{ value:'', label:'Select client…' }, ...clients.map(c => ({ value:c.id, label:c.name }))]} />
                  <Textarea value={customMsg} onChange={setCustomMsg} placeholder="Personalized message…" rows={3} />
                  <Btn variant="ghost" onClick={sendCustom} disabled={sending || !customMsg.trim() || !customClient}>Send Custom Message</Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div>
            {messages.length === 0 && <div style={{ color:UI_COLORS.fgMuted, fontSize:13 }}>No messages sent yet</div>}
            {[...messages].reverse().map(msg => (
              <div key={msg.id} style={{ display:'flex', gap:14, padding:'14px 0', borderBottom:`1px solid ${UI_COLORS.border}33` }}>
                <div style={{ width:4, background: msg.direction==='inbound' ? UI_COLORS.yellow : UI_COLORS.green, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:10, marginBottom:4, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color: msg.direction==='inbound'?UI_COLORS.yellow:UI_COLORS.pink }}>
                      {msg.direction==='inbound' ? '↙ Received' : `↗ ${msg.type||'sent'}`}
                    </span>
                    <span style={{ fontSize:11, color:UI_COLORS.fgMuted }}>{msg.direction==='inbound' ? `from ${msg.from||'unknown'}` : `→ ${msg.to||''}`}</span>
                    <span style={{ fontSize:10, color:UI_COLORS.fgDim, marginLeft:'auto' }}>{new Date(msg.sentAt).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize:13, color:UI_COLORS.fgMuted, lineHeight:1.6 }}>{msg.body || msg.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Twilio Config Modal */}
      <Modal open={twilioOpen} onClose={() => setTwilioOpen(false)} title="Connect Twilio" width={520}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:UI_COLORS.bg3, padding:'14px 16px', fontSize:12, color:UI_COLORS.fgMuted, lineHeight:1.8 }}>
            Get your credentials at <a href="https://twilio.com" target="_blank" rel="noopener" style={{ color:UI_COLORS.pink }}>twilio.com</a> →
            Console → Account SID + Auth Token + your Twilio number.
          </div>
          {[['accountSid','Account SID','ACxxxxxxxxxxxxxxxx'],['authToken','Auth Token','your auth token'],['fromNumber','Twilio Phone Number','+17743415400']].map(([key,label,placeholder]) => (
            <Field key={key} label={label}>
              <Input value={twilioConfig[key]||''} onChange={v=>setTwilioConfig(c=>({...c,[key]:v}))} placeholder={placeholder} type={key==='authToken'?'password':'text'} />
            </Field>
          ))}

          <div style={{ background:UI_COLORS.bg3, border:`1px solid ${UI_COLORS.border}`, padding:'14px 16px' }}>
            <div style={{ fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', color:UI_COLORS.pink, marginBottom:10 }}>Receiving Client Replies</div>
            <p style={{ fontSize:12, color:UI_COLORS.fgMuted, lineHeight:1.8, marginBottom:10 }}>
              To see client replies in this Inbox, set your Twilio webhook to forward inbound SMS to your phone or email:
            </p>
            <ol style={{ fontSize:12, color:UI_COLORS.fgMuted, lineHeight:2, paddingLeft:18 }}>
              <li>Go to <strong style={{color:UI_COLORS.fg}}>Twilio Console → Phone Numbers → your number</strong></li>
              <li>Under <strong style={{color:UI_COLORS.fg}}>Messaging → A Message Comes In</strong> → set to <strong style={{color:UI_COLORS.fg}}>Forward to Phone</strong></li>
              <li>Enter your personal cell → replies land in your regular texts</li>
              <li>Optionally add email notifications for every inbound text</li>
            </ol>
            <div style={{ marginTop:10, fontSize:11, color:UI_COLORS.fgMuted }}>
              You can also use the <strong style={{color:UI_COLORS.fg}}>Simulate Incoming Text</strong> panel in the Inbox tab to test the conversation view.
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <Btn onClick={() => { saveTwilio(twilioConfig); setTwilioOpen(false); }}>Save</Btn>
            <Btn variant="ghost" onClick={() => setTwilioOpen(false)}>Cancel</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
window.MessagesView = MessagesView;
