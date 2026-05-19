import { useState, useEffect, useMemo } from 'react';
import CalendarHeatmap from './components/Calendar.jsx';
import WindowsSection from './components/Windows.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle } from './tweaks-panel.jsx';
import { optimize } from './lib/optimizer.js';
import { COUNTRY_META } from './lib/countryMeta.js';

const COUNTRY_LIST = Object.keys(COUNTRY_META)
  .map(code => ({ code, ...COUNTRY_META[code] }))
  .sort((a, b) => a.name.localeCompare(b.name));

function getInitialState() {
  try {
    const saved = JSON.parse(localStorage.getItem('vacopt') || '{}');
    return { country: saved.country || 'US', region: saved.region || '', pto: saved.pto || 15, year: saved.year || 2026 };
  } catch { return { country: 'US', region: '', pto: 15, year: 2026 }; }
}

const TWEAK_DEFAULTS = { accentTone: 'sunset', showStatsCards: true, showWindowCards: true };

const TONES = {
  sunset: { sun:'oklch(0.86 0.16 90)', sunDeep:'oklch(0.72 0.17 75)', coral:'oklch(0.72 0.18 35)', teal:'oklch(0.7 0.12 200)' },
  ocean:  { sun:'oklch(0.86 0.13 220)', sunDeep:'oklch(0.7 0.15 215)',  coral:'oklch(0.72 0.16 250)', teal:'oklch(0.78 0.1 180)' },
  forest: { sun:'oklch(0.85 0.14 130)', sunDeep:'oklch(0.68 0.16 140)', coral:'oklch(0.7 0.16 35)',  teal:'oklch(0.72 0.1 170)' },
  candy:  { sun:'oklch(0.88 0.13 350)', sunDeep:'oklch(0.74 0.18 350)', coral:'oklch(0.75 0.18 0)',  teal:'oklch(0.78 0.12 280)' },
};

export default function App() {
  const initial = getInitialState();
  const [country, setCountry] = useState(initial.country);
  const [region,  setRegion]  = useState(initial.region);
  const [pto,     setPto]     = useState(initial.pto);
  const [year,    setYear]    = useState(initial.year);
  const [toast,   setToast]   = useState(null);
  const [tweaks,  setTweak]   = useTweaks(TWEAK_DEFAULTS);
  const [holidays, setHolidays] = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    localStorage.setItem('vacopt', JSON.stringify({ country, region, pto, year }));
  }, [country, region, pto, year]);

  // In dev the Vite proxy forwards /api/* to the local FastAPI backend.
  // In production builds we call Nager.Date directly (no backend needed).
  const holidayUrl = import.meta.env.DEV
    ? `/api/holidays/${country}/${year}`
    : `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(holidayUrl)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => { if (!cancelled) setHolidays(data); })
      .catch(() => { if (!cancelled) setHolidays([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [holidayUrl]);

  // Apply accent palette CSS variables
  useEffect(() => {
    const t = TONES[tweaks.accentTone] || TONES.sunset;
    const r = document.documentElement;
    r.style.setProperty('--sun',        t.sun);
    r.style.setProperty('--sun-deep',   t.sunDeep);
    r.style.setProperty('--coral',      t.coral);
    r.style.setProperty('--teal',       t.teal);
    r.style.setProperty('--hm-stretch', t.sun);
    r.style.setProperty('--hm-pto',     t.coral);
    r.style.setProperty('--hm-holiday', `oklch(from ${t.sun} 0.82 0.1 h)`);
  }, [tweaks.accentTone]);

  const countryData = COUNTRY_META[country];
  const regions = countryData?.regions || null;

  useEffect(() => {
    if (regions && region && !regions[region]) setRegion('');
    if (!regions) setRegion('');
  }, [country]);

  const today = new Date();
  const result = useMemo(() => {
    const isCurrentYear = year === today.getFullYear();
    return optimize({ year, holidays, ptoBudget: pto, today: isCurrentYear ? today : null });
  }, [year, holidays, pto]);

  const efficiency = result.ptoUsed > 0 ? result.totalDaysOff / result.ptoUsed : 0;
  const pctSlider  = ((pto - 5) / 30) * 100;

  function handleShare() {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const lines = [
      `🌴 My ${year} Vacation Plan`,
      `📍 ${countryData.name}${region && regions ? ' · ' + regions[region] : ''}`,
      `🎟️  ${result.ptoUsed}/${pto} PTO days → ${result.totalDaysOff} days off (${efficiency.toFixed(1)}× ratio)`,
      '',
      ...result.windows.map((w, i) => {
        const s = new Date(w.stretchStart + 'T00:00');
        const e = new Date(w.stretchEnd   + 'T00:00');
        return `${i+1}. ${w.theme.emoji} ${w.theme.label} — ${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()} · ${w.totalDays} days for ${w.ptoCost} PTO`;
      }),
    ].join('\n');
    navigator.clipboard?.writeText(lines);
    setToast('Plan copied to clipboard');
    setTimeout(() => setToast(null), 2200);
  }

  function openTweaks() {
    window.dispatchEvent(new MessageEvent('message', { data: { type: '__activate_edit_mode' } }));
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-mark"><div className="brand-mark-inner"/></div>
          <div>
            <h1>Off the Clock</h1>
            <div className="tag">Stretch your PTO into the longest possible vacations</div>
          </div>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <div className="year-toggle">
            <button className={year === 2026 ? 'active' : ''} onClick={() => setYear(2026)}>2026</button>
            <button className={year === 2027 ? 'active' : ''} onClick={() => setYear(2027)}>2027</button>
          </div>
          <button onClick={openTweaks} title="Customise" style={{
            width:36, height:36, borderRadius:10, border:'1px solid var(--line)',
            background:'var(--bg-card)', cursor:'pointer', fontSize:15,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>⚙️</button>
        </div>
      </header>

      <div className="controls">
        <div className="field">
          <label>Country</label>
          <div className="select-wrap">
            <select value={country} onChange={e => setCountry(e.target.value)}>
              {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>{regions ? 'Region / State' : 'Region'}</label>
          <div className="select-wrap">
            <select value={region} onChange={e => setRegion(e.target.value)}
                    disabled={!regions} style={!regions ? {opacity:0.5,cursor:'not-allowed'} : {}}>
              <option value="">{regions ? 'Nationwide only' : 'No regional holidays'}</option>
              {regions && Object.entries(regions).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field pto-slider-wrap">
          <label>PTO Days Available</label>
          <div className="pto-row">
            <span className="pto-value">{pto}</span>
            <span className="pto-unit">days</span>
            <span style={{flex:1}}/>
            <span className="mono" style={{fontSize:11,color:'var(--ink-mute)'}}>5 ─── 35</span>
          </div>
          <input type="range" min="5" max="35" step="1" value={pto}
                 onChange={e => setPto(Number(e.target.value))}
                 className="pto-slider" style={{'--pct': pctSlider + '%'}}/>
        </div>
        <button className="btn-share" onClick={handleShare}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Share plan
        </button>
      </div>

      {loading && (
        <div style={{textAlign:'center',padding:'10px 0',color:'var(--ink-mute)',fontSize:13}}>
          Loading holidays…
        </div>
      )}

      {tweaks.showStatsCards && (
        <div className="stats">
          <div className="stat-card accent-sun">
            <div className="stat-label">Total Days Off</div>
            <div className="stat-value">{result.totalDaysOff}</div>
            <div className="stat-sub">across top 3 windows</div>
          </div>
          <div className="stat-card accent-coral">
            <div className="stat-label">PTO Spent</div>
            <div className="stat-value">{result.ptoUsed}<span style={{fontSize:18,opacity:0.7}}>/{pto}</span></div>
            <div className="stat-sub">{pto - result.ptoUsed} days reserved</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Efficiency Ratio</div>
            <div className="stat-value" style={{color:'var(--coral)'}}>{efficiency.toFixed(2)}<span style={{fontSize:20}}>×</span></div>
            <div className="stat-sub">days off per PTO day</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Trip Style</div>
            <div className="stat-value" style={{fontSize:22,lineHeight:1.1}}>{result.windows.map(w=>w.theme.emoji).join(' ')}</div>
            <div className="stat-sub">{result.windows.map(w=>w.theme.label).join(' · ') || '—'}</div>
          </div>
        </div>
      )}

      <CalendarHeatmap year={year} dayIdx={result.dayIdx} windows={result.windows}/>

      {tweaks.showWindowCards && (
        <WindowsSection windows={result.windows} dayIdx={result.dayIdx}/>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Visual">
          <TweakRadio label="Accent palette" value={tweaks.accentTone} onChange={v => setTweak('accentTone', v)}
            options={[{value:'sunset',label:'Sunset'},{value:'ocean',label:'Ocean'},{value:'forest',label:'Forest'},{value:'candy',label:'Candy'}]}/>
        </TweakSection>
        <TweakSection label="Layout">
          <TweakToggle label="Stats strip"          value={tweaks.showStatsCards}  onChange={v => setTweak('showStatsCards', v)}/>
          <TweakToggle label="Window detail cards"  value={tweaks.showWindowCards} onChange={v => setTweak('showWindowCards', v)}/>
        </TweakSection>
      </TweaksPanel>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
