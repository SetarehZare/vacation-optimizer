import { useState } from 'react';
import { recommendDestinations, monthName } from '../lib/destinations.js';
import { COUNTRY_META } from '../lib/countryMeta.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toCalDate(iso) { return iso.replace(/-/g, ''); }

function addOneDay(iso) {
  const d = new Date(iso + 'T00:00');
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function exportGCal(w) {
  const title = encodeURIComponent(`🌴 ${w.theme.label} Vacation`);
  const details = encodeURIComponent(`${w.totalDays} days off · ${w.ptoCost} PTO days · ${w.ratio.toFixed(1)}× efficiency`);
  const dates = `${toCalDate(w.stretchStart)}/${addOneDay(w.stretchEnd)}`;
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`, '_blank');
}

function exportICS(w) {
  const title = `🌴 ${w.theme.label} Vacation`;
  const desc = `${w.totalDays} days off · ${w.ptoCost} PTO days · ${w.ratio.toFixed(1)}x efficiency`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Off the Clock//Vacation Optimizer//EN',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${toCalDate(w.stretchStart)}`,
    `DTEND;VALUE=DATE:${addOneDay(w.stretchEnd)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `vacation-${w.stretchStart}.ics`; a.click();
  URL.revokeObjectURL(url);
}

function fmtDateRange(startISO, endISO) {
  const s = new Date(startISO + 'T00:00');
  const e = new Date(endISO + 'T00:00');
  if (s.getMonth() === e.getMonth()) return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}`;
}

function DayChip({ info, isPto }) {
  const dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][info.weekday];
  const cls = ['detail-day', isPto ? 'pto' : info.isHoliday ? 'holiday' : info.isWeekend ? 'weekend' : ''].join(' ').trim();
  return (
    <div className={cls}>
      <span className="dot"/>
      <span>{dn} {MONTHS[info.date.getMonth()]} {info.date.getDate()}</span>
      {info.isHoliday && !isPto && <span style={{opacity:0.7,fontSize:11}}>· {info.holidayName}</span>}
      {isPto && <span style={{opacity:0.85,fontSize:11}}>PTO</span>}
    </div>
  );
}

const TONE_BY_KEY = { 1: 'tone-sun', 2: 'tone-coral', 3: 'tone-teal', custom: 'tone-custom' };

function WindowCard({ window: w, dayIdx, expanded, onToggle, selected, onSelect, onRemove }) {
  const isCustom = w.source === 'custom';
  const toneClass = TONE_BY_KEY[w.colorKey] || 'tone-sun';
  const [copied, setCopied] = useState(false);
  const days = [];
  for (let i = w.stretchStartIdx; i <= w.stretchEndIdx; i++) days.push(dayIdx.list[i]);
  const ptoSet = new Set(w.ptoDays);
  const ratioRound = w.ratio.toFixed(1);

  function copyDates() {
    const text = `${fmtDateRange(w.stretchStart, w.stretchEnd)} — ${w.totalDays} days off (${w.ptoCost} PTO)`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={`window-card ${toneClass} ${expanded ? 'expanded' : ''} ${selected ? 'selected' : ''}`} onClick={onToggle}>
      <div className="rank-pill">{w.pill}</div>
      {selected && <div className="picked-badge">✓ Picked</div>}
      <div className="theme-line">
        <span className="theme-emoji">{w.theme.emoji}</span>
        <span>{isCustom ? 'Your custom pick' : w.theme.label}</span>
      </div>
      <div className="total-days">{w.totalDays}<small>days off</small></div>
      <div className="date-range">{fmtDateRange(w.stretchStart, w.stretchEnd)}</div>
      <div className="efficiency">
        <div>
          <div className="eff-label">PTO Spent</div>
          <div className="eff-value">{w.ptoCost}<small>/{w.totalDays}</small></div>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="eff-label">Ratio</div>
          <div className="eff-value">{ratioRound}<small>×</small></div>
        </div>
      </div>
      <button className="pick-trip-btn" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        {selected ? '✓ This is my trip' : 'Choose this trip →'}
      </button>
      {onRemove && (
        <button className="remove-pick-btn" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          Remove pick
        </button>
      )}
      {expanded && (
        <div className="window-detail" onClick={e => e.stopPropagation()}>
          <div className="detail-section">
            <h4>Day-by-day breakdown</h4>
            <div className="detail-days">
              {days.map(d => <DayChip key={d.iso} info={d} isPto={ptoSet.has(d.iso)}/>)}
            </div>
          </div>
          <div className="detail-section">
            <h4>The math</h4>
            <p style={{marginBottom:8}}>
              You spend <strong>{w.ptoCost} PTO {w.ptoCost === 1 ? 'day' : 'days'}</strong> and get{' '}
              <strong>{w.totalDays} consecutive days</strong> away from work.
            </p>
            <p style={{color:'var(--ink-soft)'}}>
              That's <strong style={{color:'var(--ink)'}}>{ratioRound}× efficiency</strong> — every PTO day buys you{' '}
              {ratioRound} days of actual rest.
            </p>
            <h4 style={{marginTop:14}}>Theme</h4>
            <p>
              {w.theme.key === 'long-weekend' && 'A relaxed long weekend — perfect for a city escape or staying in.'}
              {w.theme.key === 'mini-break'   && 'A mini break — great for a regional trip or a slower-paced reset.'}
              {w.theme.key === 'getaway'      && 'A real getaway — enough time to fully disconnect and travel further.'}
              {w.theme.key === 'big-trip'     && 'A big trip window — book that long-haul flight, you have the time.'}
            </p>
          </div>
          <div className="detail-section export-row">
            <h4>Add to calendar</h4>
            <div className="export-btns">
              <button className="export-btn gcal" onClick={() => exportGCal(w)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Google Calendar
              </button>
              <button className="export-btn ical" onClick={() => exportICS(w)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download .ics
              </button>
              <button className="export-btn" onClick={copyDates}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                {copied ? 'Copied!' : 'Copy dates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DestinationsSection({ trip: w, country }) {
  const [revealed, setRevealed] = useState(false);
  const [aiIdeas, setAiIdeas] = useState(null);
  const [aiState, setAiState] = useState('idle'); // idle | loading | error
  const [aiError, setAiError] = useState('');
  const month = Number(w.stretchStart.slice(5, 7));
  const originName = COUNTRY_META[country]?.name || 'your country';
  const picks = recommendDestinations({ originCountry: country, month, tripDays: w.totalDays });

  async function getAiIdeas() {
    setAiState('loading');
    setAiError('');
    try {
      const resp = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          countryName: originName,
          monthName: monthName(month),
          tripDays: w.totalDays,
          existing: picks.map(p => p.city),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status})`);
      setAiIdeas(data.ideas || []);
      setAiState('idle');
    } catch (err) {
      setAiError(String(err.message || err));
      setAiState('error');
    }
  }

  return (
    <div className="destinations-section">
      <div className="dest-trip-line">
        <span className="dest-trip-emoji">{w.theme.emoji}</span>
        <div>
          <div className="dest-trip-label">
            {w.source === 'custom' ? 'Your dates' : 'Your pick'} · {fmtDateRange(w.stretchStart, w.stretchEnd)}
          </div>
          <div className="dest-trip-sub">{w.totalDays} days off in {monthName(month)}</div>
        </div>
        <div className="dest-export-mini">
          <button className="export-btn gcal" onClick={() => exportGCal(w)}>＋ Google Cal</button>
          <button className="export-btn ical" onClick={() => exportICS(w)}>⬇ .ics</button>
        </div>
      </div>

      {!revealed ? (
        <button className="dest-reveal-btn" onClick={() => setRevealed(true)}>
          🌍 Click to see the best destinations for this trip
        </button>
      ) : (
        <>
          <p className="dest-intro">
            Top spots for <strong>{monthName(month)}</strong>, popular with travellers from <strong>{originName}</strong>:
          </p>
          <div className="dest-grid">
            {picks.map((d, i) => (
              <div key={i} className="dest-card">
                <div className="dest-card-head">
                  <span className="dest-flag">{d.flag}</span>
                  <div>
                    <div className="dest-city">{d.city}</div>
                    <div className="dest-country">{d.country}</div>
                  </div>
                  {d.reason && <span className={`dest-season${d.reason !== 'peak season' ? ' alt' : ''}`}>{d.reason}</span>}
                </div>
                <div className="dest-vibe">{d.vibe}</div>
                <p className="dest-blurb">{d.blurb}</p>
              </div>
            ))}
          </div>

          {aiIdeas && aiIdeas.length > 0 && (
            <>
              <p className="dest-intro" style={{marginTop:20}}>
                <span className="ai-badge">✨ AI</span> More ideas, generated for your trip:
              </p>
              <div className="dest-grid">
                {aiIdeas.map((d, i) => (
                  <div key={i} className="dest-card ai">
                    <div className="dest-card-head">
                      <span className="dest-flag">{d.flag || '🌍'}</span>
                      <div>
                        <div className="dest-city">{d.city}</div>
                        <div className="dest-country">{d.country}</div>
                      </div>
                    </div>
                    {d.vibe && <div className="dest-vibe">{d.vibe}</div>}
                    <p className="dest-blurb">{d.why}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="ai-more-row">
            <button className="ai-more-btn" onClick={getAiIdeas} disabled={aiState === 'loading'}>
              {aiState === 'loading' ? 'Thinking…' : aiIdeas ? '✨ Get more AI ideas' : '✨ Get more ideas with AI'}
            </button>
            {aiState === 'error' && <span className="ai-error">{aiError}</span>}
          </div>
        </>
      )}
    </div>
  );
}

const HEADINGS = { plan: 'Top vacation windows', all: 'All vacation opportunities', custom: 'My custom picks' };

export default function WindowsSection({ windows, dayIdx, selectedKey, keyOf, onPickWindow, onRemoveWindow, viewMode }) {
  const [expanded, setExpanded] = useState(null);
  const heading = HEADINGS[viewMode] || HEADINGS.plan;
  if (!windows.length) {
    const msg = viewMode === 'custom'
      ? 'No custom picks yet — click a start day then an end day on the calendar above to add your own.'
      : 'No qualifying windows for this PTO budget — try increasing your days.';
    return (
      <div className="windows-section">
        <div className="windows-header"><h2>{heading}</h2></div>
        <div className="empty-msg">{msg}</div>
      </div>
    );
  }
  return (
    <div className="windows-section">
      <div className="windows-header">
        <h2>{heading}</h2>
        <span style={{fontSize:13, color:'var(--ink-mute)'}}>Click any card for breakdown</span>
      </div>
      <div className="windows-grid">
        {windows.map(w => {
          const k = keyOf(w);
          return (
            <WindowCard key={k} window={w} dayIdx={dayIdx}
              expanded={expanded === k}
              onToggle={() => setExpanded(expanded === k ? null : k)}
              selected={selectedKey === k}
              onSelect={() => onPickWindow(w)}
              onRemove={w.source === 'custom' ? () => onRemoveWindow(w) : null}
            />
          );
        })}
      </div>
    </div>
  );
}
