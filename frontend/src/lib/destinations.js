// Destination recommender — curated, fully client-side (works in the static demo).
// Given the user's home country and the month a trip falls in, it ranks popular
// destinations by (a) whether the trip month is a great time to visit and
// (b) how popular the spot is with travellers from the user's part of the world.

// Group the 16 supported home countries into travel regions. "popularWith" tags
// on each destination reference these keys.
const ORIGIN_REGION = {
  US: 'namerica', CA: 'namerica',
  MX: 'latam', BR: 'latam',
  GB: 'europe', DE: 'europe', FR: 'europe', ES: 'europe',
  IT: 'europe', NL: 'europe', IE: 'europe',
  JP: 'apac', IN: 'apac', SG: 'apac', AU: 'apac',
  ZA: 'africa',
};

// bestMonths use 1–12. region = where the destination itself sits (for "nearby" boost).
const DESTINATIONS = [
  // ── Europe ──────────────────────────────────────────────
  { city: 'Lisbon', country: 'Portugal', flag: '🇵🇹', region: 'europe', vibe: '🏖️ Coast & culture',
    bestMonths: [4,5,6,9,10], popularWith: ['europe','namerica','latam'],
    blurb: 'Mild, sunny, and affordable — tiled streets, pastéis de nata, and easy day trips to Sintra.' },
  { city: 'Barcelona', country: 'Spain', flag: '🇪🇸', region: 'europe', vibe: '🏙️ City & beach',
    bestMonths: [5,6,9,10], popularWith: ['europe','namerica'],
    blurb: 'Gaudí, tapas, and a city beach. Shoulder season dodges the August crush.' },
  { city: 'Rome', country: 'Italy', flag: '🇮🇹', region: 'europe', vibe: '🏛️ History',
    bestMonths: [4,5,6,9,10], popularWith: ['europe','namerica','apac'],
    blurb: 'Ancient ruins and the best food walks in spring and early autumn.' },
  { city: 'Santorini', country: 'Greece', flag: '🇬🇷', region: 'europe', vibe: '🌅 Island escape',
    bestMonths: [5,6,9,10], popularWith: ['europe','namerica','apac'],
    blurb: 'Whitewashed cliffs and caldera sunsets — go just before or after peak summer.' },
  { city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', region: 'europe', vibe: '🌷 Canals & culture',
    bestMonths: [4,5,6,9], popularWith: ['europe','namerica'],
    blurb: 'Tulip season in April–May; long bright evenings along the canals by June.' },
  { city: 'Reykjavík', country: 'Iceland', flag: '🇮🇸', region: 'europe', vibe: '🌋 Nature & aurora',
    bestMonths: [6,7,8,2,3,11], popularWith: ['europe','namerica'],
    blurb: 'Midnight sun and waterfalls in summer; northern lights and hot springs in winter.' },
  { city: 'Vienna', country: 'Austria', flag: '🇦🇹', region: 'europe', vibe: '🎄 Markets & music',
    bestMonths: [12,5,6,9], popularWith: ['europe','namerica'],
    blurb: 'Storybook Christmas markets in December; café culture and palaces in summer.' },
  { city: 'The Alps', country: 'Switzerland', flag: '🇨🇭', region: 'europe', vibe: '⛷️ Ski & snow',
    bestMonths: [1,2,3,12], popularWith: ['europe','namerica','apac'],
    blurb: 'Prime ski season — powder slopes, fondue, and mountain rail journeys.' },

  // ── North America ───────────────────────────────────────
  { city: 'New York City', country: 'USA', flag: '🇺🇸', region: 'namerica', vibe: '🏙️ Big city',
    bestMonths: [4,5,6,9,10,12], popularWith: ['namerica','europe','apac','latam'],
    blurb: 'Spring blooms, autumn colour, and dazzling December holiday lights.' },
  { city: 'Banff', country: 'Canada', flag: '🇨🇦', region: 'namerica', vibe: '🏔️ Mountains',
    bestMonths: [6,7,8,1,2], popularWith: ['namerica','apac','europe'],
    blurb: 'Turquoise lakes and hikes in summer; world-class skiing in deep winter.' },
  { city: 'Cancún & Tulum', country: 'Mexico', flag: '🇲🇽', region: 'latam', vibe: '🏖️ Beach',
    bestMonths: [12,1,2,3,4,11], popularWith: ['namerica','latam'],
    blurb: 'Caribbean beaches and cenotes at their driest and sunniest over winter.' },
  { city: 'New Orleans', country: 'USA', flag: '🇺🇸', region: 'namerica', vibe: '🎷 Food & music',
    bestMonths: [2,3,4,10,11], popularWith: ['namerica'],
    blurb: 'Jazz, Creole food, and festival season before the summer humidity hits.' },

  // ── Latin America ───────────────────────────────────────
  { city: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', region: 'latam', vibe: '🏖️ Beach & party',
    bestMonths: [12,1,2,3], popularWith: ['latam','europe','namerica'],
    blurb: 'Brazilian summer — Copacabana, Carnival energy, and Christ the Redeemer views.' },
  { city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', region: 'latam', vibe: '💃 City & tango',
    bestMonths: [3,4,5,10,11], popularWith: ['latam','europe','namerica'],
    blurb: 'Tango, steak, and grand avenues — best in the mild autumn and spring.' },
  { city: 'Machu Picchu', country: 'Peru', flag: '🇵🇪', region: 'latam', vibe: '🏔️ Ruins & trek',
    bestMonths: [5,6,7,8,9], popularWith: ['latam','namerica','europe'],
    blurb: 'Dry season means clear Inca-trail views and reliable hiking weather.' },
  { city: 'Costa Rica', country: 'Costa Rica', flag: '🇨🇷', region: 'latam', vibe: '🌿 Jungle & wildlife',
    bestMonths: [12,1,2,3,4], popularWith: ['namerica','latam','europe'],
    blurb: 'Dry season for rainforests, volcanoes, and both coastlines.' },

  // ── Asia-Pacific ────────────────────────────────────────
  { city: 'Tokyo & Kyoto', country: 'Japan', flag: '🇯🇵', region: 'apac', vibe: '🌸 Culture',
    bestMonths: [3,4,10,11], popularWith: ['apac','namerica','europe'],
    blurb: 'Cherry blossoms in spring, fiery maple leaves in autumn — Japan at its best.' },
  { city: 'Bali', country: 'Indonesia', flag: '🇮🇩', region: 'apac', vibe: '🌴 Island & temples',
    bestMonths: [4,5,6,7,8,9], popularWith: ['apac','europe'],
    blurb: 'Dry season delivers temples, rice terraces, and surf without the rain.' },
  { city: 'Bangkok & Phuket', country: 'Thailand', flag: '🇹🇭', region: 'apac', vibe: '🏖️ Beach & street food',
    bestMonths: [11,12,1,2,3], popularWith: ['apac','europe','namerica'],
    blurb: 'Cool dry season — golden temples, night markets, and island beaches.' },
  { city: 'Bora Bora', country: 'French Polynesia', flag: '🇵🇫', region: 'apac', vibe: '🐠 Overwater luxury',
    bestMonths: [5,6,7,8,9,10], popularWith: ['apac','namerica'],
    blurb: 'Dry season brings calm turquoise lagoons and perfect overwater-villa weather.' },
  { city: 'Queenstown', country: 'New Zealand', flag: '🇳🇿', region: 'apac', vibe: '🏔️ Adventure',
    bestMonths: [12,1,2,6,7,8], popularWith: ['apac','europe','namerica'],
    blurb: 'Summer hiking and lakes, or winter skiing in the Southern Alps.' },

  // ── Middle East & Africa ────────────────────────────────
  { city: 'Cape Town', country: 'South Africa', flag: '🇿🇦', region: 'africa', vibe: '🏔️ Coast & wine',
    bestMonths: [11,12,1,2,3], popularWith: ['africa','europe'],
    blurb: 'Table Mountain, beaches, and winelands in the warm, dry southern summer.' },
  { city: 'Marrakech', country: 'Morocco', flag: '🇲🇦', region: 'africa', vibe: '🕌 Souks & desert',
    bestMonths: [3,4,5,10,11], popularWith: ['europe','africa','namerica'],
    blurb: 'Comfortable temperatures for medinas, riads, and a Sahara side-trip.' },
  { city: 'Dubai', country: 'UAE', flag: '🇦🇪', region: 'apac', vibe: '🏙️ Luxury & desert',
    bestMonths: [11,12,1,2,3], popularWith: ['apac','europe','africa'],
    blurb: 'Cool season for skylines, desert safaris, and beach resorts.' },
  { city: 'Serengeti', country: 'Tanzania', flag: '🇹🇿', region: 'africa', vibe: '🦁 Safari',
    bestMonths: [6,7,8,9,10], popularWith: ['africa','europe','namerica'],
    blurb: 'Dry season is prime game-viewing and the Great Migration river crossings.' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function monthName(m) { return MONTH_NAMES[m - 1]; }

// originCountry: ISO code (e.g. 'US'). month: 1–12. Returns ranked destinations.
export function recommendDestinations({ originCountry, month, limit = 6 }) {
  const originRegion = ORIGIN_REGION[originCountry] || null;

  const scored = DESTINATIONS.map(d => {
    let score = 0;
    const inSeason = d.bestMonths.includes(month);
    if (inSeason) score += 4;
    // near-season: an adjacent month still counts a little
    else if (d.bestMonths.includes(month === 1 ? 12 : month - 1) ||
             d.bestMonths.includes(month === 12 ? 1 : month + 1)) score += 1.5;

    if (originRegion && d.popularWith.includes(originRegion)) score += 2.5;
    // regional travel is common — small boost for staying in your part of the world,
    // but don't recommend the user's own country as a "destination".
    if (originRegion && d.region === originRegion) score += 1;

    return { ...d, score, inSeason };
  });

  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score || (b.inSeason - a.inSeason))
    .slice(0, limit);
}
