import { useState } from 'react';

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

function WindowCard({ window: w, dayIdx, expanded, onToggle }) {
  const tones = ['tone-sun', 'tone-coral', 'tone-teal'];
  const days = [];
  for (let i = w.stretchStartIdx; i <= w.stretchEndIdx; i++) days.push(dayIdx.list[i]);
  const ptoSet = new Set(w.ptoDays);
  const ratioRound = w.ratio.toFixed(1);

  return (
    <div className={`window-card ${tones[w.rank]} ${expanded ? 'expanded' : ''}`} onClick={onToggle}>
      <div className="rank-pill">#{w.rank + 1}</div>
      <div className="theme-line">
        <span className="theme-emoji">{w.theme.emoji}</span>
        <span>{w.theme.label}</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WindowsSection({ windows, dayIdx }) {
  const [expanded, setExpanded] = useState(null);
  if (!windows.length) {
    return (
      <div className="windows-section">
        <div className="windows-header"><h2>Top vacation windows</h2></div>
        <div className="empty-msg">No qualifying windows for this PTO budget — try increasing your days.</div>
      </div>
    );
  }
  return (
    <div className="windows-section">
      <div className="windows-header">
        <h2>Top vacation windows</h2>
        <span style={{fontSize:13, color:'var(--ink-mute)'}}>Click any card for breakdown</span>
      </div>
      <div className="windows-grid">
        {windows.map(w => (
          <WindowCard key={w.rank} window={w} dayIdx={dayIdx}
            expanded={expanded === w.rank}
            onToggle={() => setExpanded(expanded === w.rank ? null : w.rank)}
          />
        ))}
      </div>
    </div>
  );
}
