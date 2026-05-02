import { useMemo, useState, useRef } from 'react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CalendarHeatmap({ year, dayIdx, windows }) {
  const [tooltip, setTooltip] = useState(null);

  const windowMap = useMemo(() => {
    const m = {};
    windows.forEach((w, i) => {
      for (let idx = w.stretchStartIdx; idx <= w.stretchEndIdx; idx++) {
        const info = dayIdx.list[idx];
        if (!info) continue;
        m[info.iso] = m[info.iso] || {};
        m[info.iso].windowRank = i + 1;
        m[info.iso].windowTotalDays = w.totalDays;
        m[info.iso].windowPtoCost = w.ptoCost;
      }
      w.ptoDays.forEach(d => {
        m[d] = m[d] || {};
        m[d].isPto = true;
        m[d].windowRank = i + 1;
      });
    });
    return m;
  }, [windows, dayIdx]);

  function findBracket(iso) {
    const info = dayIdx.map[iso];
    if (!info) return null;
    const list = dayIdx.list;
    const idx = list.indexOf(info);
    let prev = null, next = null;
    for (let i = idx - 1; i >= Math.max(0, idx - 14); i--) {
      if (list[i].isHoliday) { prev = list[i]; break; }
    }
    for (let i = idx + 1; i <= Math.min(list.length - 1, idx + 14); i++) {
      if (list[i].isHoliday) { next = list[i]; break; }
    }
    return { prev, next };
  }

  function handleHover(e, iso) {
    const info = dayIdx.map[iso];
    if (!info) { setTooltip(null); return; }
    const rect = e.target.getBoundingClientRect();
    const wm = windowMap[iso];
    const bracket = findBracket(iso);
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][info.weekday];
    const monthName = MONTHS[info.date.getMonth()];
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 12, content: { info, wm, bracket, dayName, monthName } });
  }

  function cellClass(iso) {
    const info = dayIdx.map[iso];
    if (!info) return 'day-cell placeholder';
    const wm = windowMap[iso];
    const cls = ['day-cell'];
    if (info.isHoliday) cls.push('holiday');
    else if (info.isWeekend) cls.push('weekend');
    if (wm) {
      cls.push('in-stretch');
      if (wm.isPto) cls.push('pto-day');
      if (wm.windowRank) cls.push(`window-${wm.windowRank}`);
    }
    return cls.join(' ');
  }

  return (
    <div className="calendar-card">
      <div className="cal-header">
        <h2>Year <span>{year}</span> at a glance</h2>
        <div className="cal-legend">
          <div className="legend-item"><div className="legend-swatch" style={{background:'var(--hm-weekend)'}}/>Weekend</div>
          <div className="legend-item"><div className="legend-swatch" style={{background:'var(--hm-holiday)'}}/>Holiday</div>
          <div className="legend-item"><div className="legend-swatch" style={{background:'var(--hm-pto)'}}/>PTO</div>
          <div className="legend-item"><div className="legend-swatch" style={{background:'var(--hm-stretch)', boxShadow:'inset 0 0 0 1.5px var(--sun-deep)'}}/>Stretch</div>
        </div>
      </div>

      <div className="year-grid">
        {MONTHS.map((m, mi) => {
          const daysInMonth = new Date(year, mi + 1, 0).getDate();
          const cells = [];
          for (let d = 1; d <= 31; d++) {
            if (d > daysInMonth) {
              cells.push(<div key={d} className="day-cell placeholder"/>);
            } else {
              const iso = `${year}-${String(mi+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              cells.push(
                <div key={d} className={cellClass(iso)}
                  onMouseEnter={(e) => handleHover(e, iso)}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            }
          }
          return (
            <div key={mi} className="month-row">
              <div className="month-label">{m}</div>
              <div className="month-cells">{cells}</div>
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}>
          <strong>{tooltip.content.dayName}, {tooltip.content.monthName} {tooltip.content.info.date.getDate()}</strong>
          {tooltip.content.info.isHoliday && <div className="tip-meta">🎉 {tooltip.content.info.holidayName}</div>}
          {!tooltip.content.info.isHoliday && tooltip.content.info.isWeekend && <div className="tip-meta">Weekend</div>}
          {!tooltip.content.info.isOff && !tooltip.content.wm && <div className="tip-meta">Workday</div>}
          {tooltip.content.wm && (
            <div className="tip-meta">
              {tooltip.content.wm.isPto ? '✈️ Take PTO this day' : '🌴 Part of vacation window'}
              {' · '}{tooltip.content.wm.windowTotalDays} days off
            </div>
          )}
          {tooltip.content.bracket && (tooltip.content.bracket.prev || tooltip.content.bracket.next) && (
            <div className="tip-bracket">
              {tooltip.content.bracket.prev && <div>← <b>{tooltip.content.bracket.prev.holidayName}</b></div>}
              {tooltip.content.bracket.next && <div><b>{tooltip.content.bracket.next.holidayName}</b> →</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
