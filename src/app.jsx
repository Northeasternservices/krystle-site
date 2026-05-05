const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "pinkHue": "352",
  "theme": "light",
  "fontStyle": "serif"
}/*EDITMODE-END*/;

const services = [
  {
    name: "Classic Lashes",
    desc: "A natural, defined look. One extension per natural lash for effortless everyday elegance.",
    detail: "Fill every 2–3 weeks"
  },
  {
    name: "Hybrid Lashes",
    desc: "The best of both worlds — a textured, wispy blend of classic and volume techniques.",
    detail: "Fill every 2–3 weeks"
  },
  {
    name: "Volume Lashes",
    desc: "Dramatic, full, fluffy fans for a bold and luxurious look that still feels light.",
    detail: "Fill every 2–3 weeks"
  },
  {
    name: "Lash Lift & Tint",
    desc: "Lift, curl, and darken your natural lashes. No extensions — just beautiful, low-maintenance results.",
    detail: "Lasts 6–8 weeks"
  },
  {
    name: "Brow Henna",
    desc: "Semi-permanent brow tinting that stains skin and hair for defined, filled-in brows.",
    detail: "Lasts 2–4 weeks"
  },
  {
    name: "Brow Lamination",
    desc: "Brushed-up, fluffy brows made to last. A non-invasive treatment that restructures brow hairs.",
    detail: "Lasts 6–8 weeks"
  }
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealDiv({ className, children, delay = 0, style = {} }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className || ''}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function RevealContact({ label, reveal, href, icon }) {
  const [shown, setShown] = React.useState(false);
  const isExternal = href.startsWith('http');
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20, padding:'22px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{width:40, height:40, borderRadius:'50%', background:'var(--bg2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:9, letterSpacing:'0.25em', textTransform:'uppercase', color:'var(--fg-muted)', marginBottom:4}}>{label}</div>
        {shown ? (
          <a href={href} target={isExternal?'_blank':undefined} rel="noopener"
            style={{fontSize:15, color:'var(--pink)', textDecoration:'none'}}>
            {reveal}
          </a>
        ) : (
          <button onClick={() => setShown(true)} style={{
            background:'none', border:'1px solid var(--border)', color:'var(--fg-muted)',
            fontFamily:'var(--sans)', fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase',
            padding:'5px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:6,
            transition:'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--pink)'; e.currentTarget.style.color='var(--pink)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--fg-muted)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Tap to reveal
          </button>
        )}
      </div>
      {shown && (
        <svg style={{opacity:0.3, flexShrink:0}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      )}
    </div>
  );
}

function App() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  // Apply tweaks to CSS vars
  useEffect(() => {
    const h = tweaks.pinkHue;
    document.documentElement.style.setProperty('--pink', `oklch(0.72 0.14 ${h})`);
    document.documentElement.style.setProperty('--pink-deep', `oklch(0.52 0.18 ${h})`);
    document.documentElement.style.setProperty('--pink-faint', `oklch(0.72 0.14 ${h} / 0.12)`);

    if (tweaks.theme === 'light') {
      document.documentElement.style.setProperty('--bg', '#f7f3f0');
      document.documentElement.style.setProperty('--bg2', '#ede8e4');
      document.documentElement.style.setProperty('--fg', '#1a1214');
      document.documentElement.style.setProperty('--fg-muted', 'rgba(26,18,20,0.5)');
      document.documentElement.style.setProperty('--border', 'rgba(26,18,20,0.12)');
    } else {
      document.documentElement.style.setProperty('--bg', '#0c0a0b');
      document.documentElement.style.setProperty('--bg2', '#120f10');
      document.documentElement.style.setProperty('--fg', '#f0ece8');
      document.documentElement.style.setProperty('--fg-muted', 'rgba(240,236,232,0.5)');
      document.documentElement.style.setProperty('--border', 'rgba(240,236,232,0.1)');
    }

    if (tweaks.fontStyle === 'modern') {
      document.documentElement.style.setProperty('--serif', "'Jost', sans-serif");
    } else {
      document.documentElement.style.setProperty('--serif', "'Cormorant Garamond', Georgia, serif");
    }
  }, [tweaks]);

  // Tweaks host integration
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const applyTweak = (key, val) => {
    const next = { ...tweaks, [key]: val };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  return (
    <>
      {/* NAV */}
      <nav>
        <a href="#hero" className="nav-logo">Krystle <span style={{fontStyle:'italic', color:'var(--pink)'}}>& Co</span></a>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#gallery">Gallery</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#booking">Booking</a></li>
          <li><a href="#contact-section">Contact</a></li>
          <li><a href="https://api.krystleandco.com/portal">My Account</a></li>
        </ul>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <div className="social-links">
            <a href="https://www.instagram.com/lashed.beautyby_krystle" target="_blank" rel="noopener" className="social-link" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4.5"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/share/1KcyyFMuq4/?mibextid=wwXIfr" target="_blank" rel="noopener" className="social-link" aria-label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
          </div>
          <a href="https://api.krystleandco.com/portal" className="social-link" aria-label="My Account" style={{width:36, height:36}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </a>
          <a href="booking.html" className="nav-book">
            Book Now
          </a>
        </div>
      </nav>

      {/* HERO */}
      <div id="hero" className="hero">
        <div className="hero-bg-circle" />
        <div className="hero-eyebrow">Ashland, MA · Lash & Brow Studio</div>
        <h1 className="hero-title">
          Krystle<br />
          <em>& Co</em>
        </h1>
        <p className="hero-subtitle">Woman Owned · Small Business</p>
        <div className="hero-ctas">
          <a href="booking.html" className="btn-primary">
            Book Your Appointment
          </a>
          <a href="#services" className="btn-ghost">View Services</a>
        </div>
        <div className="hero-divider">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </div>

      {/* SERVICES */}
      <div id="services" className="section-full">
        <div className="inner">
          <RevealDiv>
            <div className="section-label"><span>Services</span></div>
          </RevealDiv>
          <div className="services-intro">
            <RevealDiv delay={100}>
              <h2 className="section-heading">
                Crafted with<br /><em>precision</em>
              </h2>
            </RevealDiv>
            <RevealDiv delay={200} className="services-tagline">
              <p>Every service is tailored to enhance your natural beauty. Whether you're after effortless everyday lashes or bold, dramatic volume — we've got you covered.</p>
              <p style={{marginTop: 12, fontSize: 12, color: 'var(--pink)', letterSpacing: '0.1em'}}>Contact for current pricing →</p>
            </RevealDiv>
          </div>
          <RevealDiv delay={300}>
            <div className="services-grid">
              {services.map((svc, i) => (
                <div key={i} className="service-card">
                  <span className="service-number">0{i + 1}</span>
                  <div className="service-name">{svc.name}</div>
                  <p className="service-desc">{svc.desc}</p>
                  <div className="service-divider" />
                  <div className="service-price"><strong>{svc.detail}</strong></div>
                </div>
              ))}
            </div>
          </RevealDiv>
        </div>
      </div>

      {/* GALLERY / RECENT WORK */}
      {(() => {
        const featured = (() => { try { const d = JSON.parse(localStorage.getItem('kc_admin_v1') || '{}'); return (d.photos || []).filter(p => p.featured); } catch { return []; } })();
        if (featured.length === 0) return null;
        return (
          <div id="gallery" className="section-full">
            <div className="inner">
              <RevealDiv>
                <div className="section-label"><span>Recent Work</span></div>
              </RevealDiv>
              <RevealDiv delay={100}>
                <h2 className="section-heading">
                  The <em>work</em>
                </h2>
              </RevealDiv>
              <RevealDiv delay={200}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '2px',
                  marginTop: '40px',
                }}>
                  {featured.map((photo, i) => (
                    <div key={photo.id || i} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                      <img src={photo.dataUrl} alt={photo.caption || 'Recent work'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: 'block' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                      {photo.caption && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          padding: '32px 16px 12px',
                          background: 'linear-gradient(to top, rgba(12,10,11,0.8) 0%, transparent 100%)',
                          fontSize: '12px', color: 'rgba(240,236,232,0.85)', opacity: 0,
                          transition: 'opacity 0.3s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        >{photo.caption}</div>
                      )}
                    </div>
                  ))}
                </div>
              </RevealDiv>
            </div>
          </div>
        );
      })()}

      {/* ABOUT */}
      <section id="about">
        <RevealDiv>
          <div className="section-label"><span>About</span></div>
        </RevealDiv>
        <div className="about-grid">
          <RevealDiv delay={100}>
            <div className="about-image-wrap">
              <div className="about-image-placeholder">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="14" r="7" stroke="rgba(240,236,232,0.2)" strokeWidth="1.5"/>
                  <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="rgba(240,236,232,0.2)" strokeWidth="1.5"/>
                </svg>
                <span>Your photo here</span>
              </div>
              <div className="about-accent-box" />
            </div>
          </RevealDiv>
          <RevealDiv delay={200}>
            <div className="about-text">
              <div className="section-label"><span>Our Story</span></div>
              <h2 className="section-heading">Meet <em>Krystle</em></h2>
              <p>
                "I believe every person deserves to feel confident and beautiful — not just on special occasions, but every single day."
              </p>
              <p>
                Based in Ashland, MA, Krystle & Co is a woman-owned lash and brow studio dedicated to delivering studio-quality results in a warm, welcoming environment.
              </p>
              <p>
                From classic lash sets to brow transformations, every appointment is a personalized experience built around your unique features and lifestyle.
              </p>
              <div className="about-badge">
                <div className="about-badge-dot" />
                <span>Woman Owned & Operated · Ashland, MA</span>
              </div>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* BOOKING */}
      <div id="booking" className="section-full">
        <div className="inner">
          <RevealDiv>
            <div className="section-label"><span>Booking</span></div>
          </RevealDiv>
          <RevealDiv delay={100}>
            <div className="booking-wrap">
              <h2 className="section-heading">Ready to <em>transform</em><br/>your look?</h2>
              <p>
                Appointments are available online — simply choose your service, pick a time that works for you, and we'll take care of the rest.
              </p>
              <a href="booking.html" className="btn-primary" style={{fontSize: 13, padding: '20px 56px'}}>
                Book an Appointment
              </a>
              <div className="booking-meta">
                <div className="booking-meta-item">
                  <span className="booking-meta-label">Location</span>
                  <span className="booking-meta-value">Ashland, MA</span>
                </div>
                <div className="booking-meta-item">
                  <span className="booking-meta-label">Booking</span>
                  <span className="booking-meta-value">Online</span>
                </div>
                <div className="booking-meta-item">
                  <span className="booking-meta-label">Owned By</span>
                  <span className="booking-meta-value">Krystle</span>
                </div>
              </div>
            </div>
          </RevealDiv>
        </div>
      </div>

      {/* CONTACT */}
      <section id="contact-section" className="section-full" style={{borderTop:'1px solid var(--border)'}}>
        <div className="inner">
          <RevealDiv>
            <div className="section-label"><span>Contact</span></div>
          </RevealDiv>
          <RevealDiv delay={100}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'start', maxWidth:900, margin:'0 auto', padding:'48px 0 64px'}}>
              {/* Left — headline */}
              <div>
                <h2 className="section-heading" style={{marginBottom:20}}>Get in <em>touch</em></h2>
                <p style={{fontSize:15, color:'var(--fg-muted)', lineHeight:1.9, marginBottom:32}}>
                  Have a question about services, pricing, or want to chat about your lash goals? Reach out — we'd love to hear from you.
                </p>
                <a href="booking.html" className="btn-primary" style={{fontSize:12}}>Book an Appointment</a>
              </div>
              {/* Right — contact details */}
              <div style={{display:'flex', flexDirection:'column', gap:0}}>
                {[
                  {
                    label: 'Email',
                    reveal: 'krystle@krystleandco.com',
                    href: 'mailto:krystle@krystleandco.com',
                    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                  },
                  {
                    label: 'Text Us',
                    reveal: '+1 (774) 341-5400',
                    href: 'sms:+17743415400',
                    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                  },
                  {
                    label: 'Location',
                    reveal: '79 Main St, Ashland, MA 01721',
                    href: 'https://maps.google.com/?q=79+Main+St+Ashland+MA+01721',
                    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
                  },
                  {
                    label: 'Instagram',
                    reveal: '@lashed.beautyby_krystle',
                    href: 'https://www.instagram.com/lashed.beautyby_krystle',
                    icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z',
                  },
                  {
                    label: 'Facebook',
                    reveal: 'Krystle & Co on Facebook',
                    href: 'https://www.facebook.com/share/1KcyyFMuq4/?mibextid=wwXIfr',
                    icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
                  },
                ].map(({label, reveal, href, icon}) => (
                  <RevealContact key={label} label={label} reveal={reveal} href={href} icon={icon} />
                ))}
              </div>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact">
        <div className="footer-logo">Krystle <em style={{fontStyle:'italic', color:'var(--pink)'}}>& Co</em></div>
        <div className="footer-copy">© 2026 Krystle & Co · Ashland, MA</div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:12}}>
          <div className="social-links">
            {/* Instagram */}
            <a href="https://www.instagram.com/lashed.beautyby_krystle" target="_blank" rel="noopener" className="social-link" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4.5"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href="https://www.facebook.com/share/1KcyyFMuq4/?mibextid=wwXIfr" target="_blank" rel="noopener" className="social-link" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
          </div>
          <div className="footer-tagline">Woman Owned · Small Business</div>
        </div>
      </footer>

      {/* TWEAKS PANEL */}
      <div className={`tweaks-panel ${tweaksOpen ? 'open' : ''}`}>
        <div className="tweaks-title">Tweaks</div>

        <div className="tweak-row">
          <div className="tweak-label">Accent Color</div>
          <div className="tweak-options">
            {[['Rose Pink', '352'], ['Mauve', '330'], ['Coral', '20'], ['Lavender', '300']].map(([label, hue]) => (
              <button key={hue} className={`tweak-btn ${tweaks.pinkHue === hue ? 'active' : ''}`} onClick={() => applyTweak('pinkHue', hue)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="tweak-row">
          <div className="tweak-label">Theme</div>
          <div className="tweak-options">
            {[['Dark', 'dark'], ['Light', 'light']].map(([label, val]) => (
              <button key={val} className={`tweak-btn ${tweaks.theme === val ? 'active' : ''}`} onClick={() => applyTweak('theme', val)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="tweak-row">
          <div className="tweak-label">Heading Style</div>
          <div className="tweak-options">
            {[['Elegant Serif', 'serif'], ['Modern Sans', 'modern']].map(([label, val]) => (
              <button key={val} className={`tweak-btn ${tweaks.fontStyle === val ? 'active' : ''}`} onClick={() => applyTweak('fontStyle', val)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);