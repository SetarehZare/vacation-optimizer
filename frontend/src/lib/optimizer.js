// Vacation window optimization — converted from prototype IIFE to ES module.
// No external dependencies; runs entirely client-side.

function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmtISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function buildDayIndex(year, holidays) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const total = daysBetween(start, end) + 1;
  const map = {};
  const list = [];
  const holidaySet = {};
  for (const h of holidays) holidaySet[h.date] = h.name;
  for (let i = 0; i < total; i++) {
    const d = addDays(start, i);
    const iso = fmtISO(d);
    const weekday = d.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isHoliday = !!holidaySet[iso];
    const info = {
      iso, date: d, weekday, isWeekend, isHoliday,
      holidayName: holidaySet[iso] || null,
      isOff: isWeekend || isHoliday,
    };
    map[iso] = info;
    list.push(info);
  }
  return { map, list, year };
}

function expandStretch(list, startIdx, endIdx) {
  let s = startIdx, e = endIdx;
  while (s > 0 && list[s - 1].isOff) s--;
  while (e < list.length - 1 && list[e + 1].isOff) e++;
  return [s, e];
}

function generateCandidates(dayIdx, maxBudget, startFromIdx = 0) {
  const list = dayIdx.list;
  const candidates = [];
  const seen = new Set();

  for (let i = startFromIdx; i < list.length; i++) {
    for (let b = 1; b <= maxBudget; b++) {
      let j = i, used = 0;
      const ptoDays = [];
      while (used < b && j < list.length) {
        if (!list[j].isOff) { ptoDays.push(list[j].iso); used++; }
        j++;
      }
      if (used < b) continue;
      const blockEnd = j - 1;
      const [stretchS, stretchE] = expandStretch(list, i, blockEnd);
      const totalDays = stretchE - stretchS + 1;
      const ratio = totalDays / b;
      const key = `${stretchS}-${stretchE}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (ratio < 1.2) continue;
      candidates.push({
        ptoCost: b, ptoDays,
        stretchStartIdx: stretchS, stretchEndIdx: stretchE,
        stretchStart: list[stretchS].iso, stretchEnd: list[stretchE].iso,
        totalDays, ratio,
      });
    }
  }
  return candidates;
}

function pickWindowsWithinBudget(candidates, budget, count = 3) {
  if (!candidates.length) return { picked: [], ptoUsed: 0 };

  const byRatio = [...candidates].sort((a, b) => {
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    if (b.totalDays !== a.totalDays) return b.totalDays - a.totalDays;
    return a.ptoCost - b.ptoCost;
  });

  const overlapsAny = (c, list) =>
    list.some(p => !(c.stretchEndIdx < p.stretchStartIdx - 1 || c.stretchStartIdx > p.stretchEndIdx + 1));

  const picked = [];
  let used = 0;
  for (const c of byRatio) {
    if (picked.length >= count) break;
    if (used + c.ptoCost > budget) continue;
    if (overlapsAny(c, picked)) continue;
    picked.push(c);
    used += c.ptoCost;
  }

  let improved = true, safety = 50;
  while (improved && safety-- > 0) {
    improved = false;
    for (let i = 0; i < picked.length; i++) {
      const cur = picked[i];
      const others = picked.filter((_, j) => j !== i);
      const remaining = budget - used + cur.ptoCost;
      let best = null;
      for (const c of candidates) {
        if (c === cur) continue;
        if (c.ptoCost <= cur.ptoCost) continue;
        if (c.totalDays <= cur.totalDays) continue;
        if (c.ptoCost > remaining) continue;
        const touchesCur = !(c.stretchEndIdx < cur.stretchStartIdx - 1 || c.stretchStartIdx > cur.stretchEndIdx + 1);
        if (!touchesCur) continue;
        if (overlapsAny(c, others)) continue;
        const gainRatio = (c.totalDays - cur.totalDays) / (c.ptoCost - cur.ptoCost);
        if (!best || gainRatio > best._gain || (gainRatio === best._gain && c.totalDays > best.totalDays)) {
          best = { ...c, _gain: gainRatio };
        }
      }
      if (best) { used = used - cur.ptoCost + best.ptoCost; picked[i] = best; improved = true; }
    }
  }

  if (picked.length < count) {
    const byLength = [...candidates].sort((a, b) => b.totalDays - a.totalDays || b.ratio - a.ratio);
    for (const c of byLength) {
      if (picked.length >= count) break;
      if (used + c.ptoCost > budget) continue;
      if (overlapsAny(c, picked)) continue;
      picked.push(c);
      used += c.ptoCost;
    }
  }

  picked.sort((a, b) => a.stretchStartIdx - b.stretchStartIdx);
  return { picked, ptoUsed: used };
}

function themeFor(totalDays) {
  if (totalDays <= 4)  return { key: 'long-weekend', label: 'Long Weekend', emoji: '☕️' };
  if (totalDays <= 7)  return { key: 'mini-break',   label: 'Mini Break',   emoji: '🧳' };
  if (totalDays <= 11) return { key: 'getaway',       label: 'Real Getaway', emoji: '🌅' };
  return                      { key: 'big-trip',      label: 'Big Trip',     emoji: '✈️' };
}

export function optimize({ year, holidays, ptoBudget, today }) {
  const dayIdx = buildDayIndex(year, holidays);
  const maxPerWindow = Math.min(ptoBudget, Math.max(12, Math.ceil(ptoBudget * 0.8)));
  let startFromIdx = 0;
  if (today) {
    const todayISO = fmtISO(today);
    const idx = dayIdx.list.findIndex(d => d.iso >= todayISO);
    if (idx !== -1) startFromIdx = idx;
  }
  const cands = generateCandidates(dayIdx, maxPerWindow, startFromIdx);
  const { picked, ptoUsed } = pickWindowsWithinBudget(cands, ptoBudget, 3);
  return {
    dayIdx,
    windows: picked.map((w, i) => ({ ...w, rank: i, theme: themeFor(w.totalDays) })),
    ptoUsed,
    totalDaysOff: picked.reduce((s, w) => s + w.totalDays, 0),
  };
}

export { parseISO, fmtISO, addDays, themeFor, buildDayIndex };
