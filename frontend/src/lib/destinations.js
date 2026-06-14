// Destination recommender — curated, fully client-side (works in the static demo).
// Ranks destinations by: (a) is the trip month a great time to visit, (b) how
// popular the spot is with travellers from the user's region, and (c) whether the
// distance suits the trip LENGTH (short trips → nearby, long trips → long-haul).

// Group the 16 supported home countries into travel regions.
const ORIGIN_REGION = {
  US: 'namerica', CA: 'namerica',
  MX: 'latam', BR: 'latam',
  GB: 'europe', DE: 'europe', FR: 'europe', ES: 'europe',
  IT: 'europe', NL: 'europe', IE: 'europe',
  JP: 'apac', IN: 'apac', SG: 'apac', AU: 'apac',
  ZA: 'africa',
};

// How "close" each destination region feels from each origin region.
// 2 = near (quick hop), 1 = medium-haul, 0 = far (long-haul).
const AFFINITY = {
  namerica: { namerica: 2, latam: 2, europe: 1, mideast: 0, africa: 0, apac: 0 },
  latam:    { latam: 2, namerica: 2, europe: 1, africa: 0, mideast: 0, apac: 0 },
  europe:   { europe: 2, africa: 1, mideast: 1, namerica: 1, latam: 0, apac: 0 },
  apac:     { apac: 2, mideast: 1, namerica: 1, africa: 0, europe: 0, latam: 0 },
  africa:   { africa: 2, europe: 1, mideast: 1, apac: 0, namerica: 0, latam: 0 },
};

// bestMonths use 1–12. region = where it sits. homeCode = skip for travellers
// who already live there. popularWith = origin regions that favour it.
const DESTINATIONS = [
  // ── Europe ──────────────────────────────────────────────
  { city: 'Lisbon', country: 'Portugal', flag: '🇵🇹', region: 'europe', vibe: '🏖️ Coast & culture', bestMonths: [4,5,6,9,10], popularWith: ['europe','namerica','latam'], blurb: 'Tiled streets, pastéis de nata, and easy day trips to Sintra — mild and affordable.' },
  { city: 'Barcelona', country: 'Spain', flag: '🇪🇸', region: 'europe', homeCode: 'ES', vibe: '🏙️ City & beach', bestMonths: [5,6,9,10], popularWith: ['europe','namerica'], blurb: 'Gaudí, tapas, and a city beach — shoulder season dodges the August crush.' },
  { city: 'Mallorca', country: 'Spain', flag: '🇪🇸', region: 'europe', homeCode: 'ES', vibe: '🌊 Island & coves', bestMonths: [5,6,7,8,9], popularWith: ['europe'], blurb: 'Turquoise coves and mountain villages — the Mediterranean summer classic.' },
  { city: 'Andalusia', country: 'Spain', flag: '🇪🇸', region: 'europe', homeCode: 'ES', vibe: '💃 Culture & sun', bestMonths: [3,4,5,10], popularWith: ['europe','namerica'], blurb: 'Seville, Granada, and flamenco before the summer heat becomes brutal.' },
  { city: 'Rome', country: 'Italy', flag: '🇮🇹', region: 'europe', homeCode: 'IT', vibe: '🏛️ History', bestMonths: [4,5,6,9,10], popularWith: ['europe','namerica','apac'], blurb: 'Ancient ruins and the best food walks in spring and early autumn.' },
  { city: 'Amalfi Coast', country: 'Italy', flag: '🇮🇹', region: 'europe', homeCode: 'IT', vibe: '🌅 Coast', bestMonths: [5,6,9], popularWith: ['europe','namerica'], blurb: 'Cliffside lemon groves and pastel towns — magic just outside peak August.' },
  { city: 'Venice', country: 'Italy', flag: '🇮🇹', region: 'europe', homeCode: 'IT', vibe: '🚣 Canals', bestMonths: [4,5,9,10], popularWith: ['europe','namerica','apac'], blurb: 'Canals and quiet backstreets are loveliest in the mild shoulder months.' },
  { city: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe', homeCode: 'FR', vibe: '🗼 City', bestMonths: [4,5,6,9,10], popularWith: ['europe','namerica','apac'], blurb: 'Café terraces, gardens in bloom, and long golden evenings.' },
  { city: 'French Riviera', country: 'France', flag: '🇫🇷', region: 'europe', homeCode: 'FR', vibe: '🛥️ Beach & glam', bestMonths: [6,7,8,9], popularWith: ['europe','namerica'], blurb: 'Nice, Cannes, and turquoise water — full Mediterranean summer.' },
  { city: 'Provence', country: 'France', flag: '🇫🇷', region: 'europe', homeCode: 'FR', vibe: '💜 Countryside', bestMonths: [5,6,7], popularWith: ['europe','namerica'], blurb: 'Lavender fields, hilltop villages, and rosé in the early summer sun.' },
  { city: 'Santorini', country: 'Greece', flag: '🇬🇷', region: 'europe', vibe: '🌅 Island escape', bestMonths: [5,6,9,10], popularWith: ['europe','namerica','apac'], blurb: 'Whitewashed cliffs and caldera sunsets — just before or after peak summer.' },
  { city: 'Greek Islands', country: 'Greece', flag: '🇬🇷', region: 'europe', vibe: '⛵ Island hopping', bestMonths: [6,7,8,9], popularWith: ['europe','namerica'], blurb: 'Mykonos, Naxos, Milos — ferry between beaches all summer long.' },
  { city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', region: 'europe', homeCode: 'NL', vibe: '🌷 Canals & culture', bestMonths: [4,5,6,9], popularWith: ['europe','namerica'], blurb: 'Tulip season in April–May; bright canal-side evenings by June.' },
  { city: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'europe', homeCode: 'GB', vibe: '🎭 City', bestMonths: [5,6,7,9,12], popularWith: ['europe','namerica','apac'], blurb: 'Parks, markets, and theatre in summer; dazzling lights in December.' },
  { city: 'Scottish Highlands', country: 'United Kingdom', flag: '🏴', region: 'europe', homeCode: 'GB', vibe: '🏔️ Nature', bestMonths: [5,6,7,8,9], popularWith: ['europe','namerica'], blurb: 'Lochs, castles, and dramatic glens in the long northern summer days.' },
  { city: 'Dublin & the West', country: 'Ireland', flag: '🇮🇪', region: 'europe', homeCode: 'IE', vibe: '🍀 City & coast', bestMonths: [5,6,7,8], popularWith: ['europe','namerica'], blurb: 'Pubs, cliffs, and emerald countryside at their greenest and mildest.' },
  { city: 'Reykjavík & Ring Road', country: 'Iceland', flag: '🇮🇸', region: 'europe', vibe: '🌋 Nature & aurora', bestMonths: [6,7,8,2,3,11], popularWith: ['europe','namerica'], blurb: 'Midnight-sun waterfalls in summer; northern lights and hot springs in winter.' },
  { city: 'Vienna', country: 'Austria', flag: '🇦🇹', region: 'europe', vibe: '🎄 Markets & music', bestMonths: [12,5,6,9], popularWith: ['europe','namerica'], blurb: 'Storybook Christmas markets in December; palaces and cafés in summer.' },
  { city: 'Swiss Alps', country: 'Switzerland', flag: '🇨🇭', region: 'europe', vibe: '⛷️ Ski & snow', bestMonths: [1,2,3,12], popularWith: ['europe','namerica','apac'], blurb: 'Prime ski season — powder slopes, fondue, and mountain rail journeys.' },
  { city: 'Interlaken', country: 'Switzerland', flag: '🇨🇭', region: 'europe', vibe: '🥾 Alpine hiking', bestMonths: [6,7,8,9], popularWith: ['europe','namerica','apac'], blurb: 'Cable cars, glacial lakes, and wildflower trails in the high summer.' },
  { city: 'Prague', country: 'Czechia', flag: '🇨🇿', region: 'europe', vibe: '🏰 Old town', bestMonths: [4,5,6,9,12], popularWith: ['europe','namerica'], blurb: 'Gothic spires and beer gardens — fairytale Christmas markets too.' },
  { city: 'Dalmatian Coast', country: 'Croatia', flag: '🇭🇷', region: 'europe', vibe: '🏖️ Coast & islands', bestMonths: [6,7,8,9], popularWith: ['europe','namerica'], blurb: 'Dubrovnik walls, Split, and island-hopping in the warm Adriatic.' },
  { city: 'Munich & Bavaria', country: 'Germany', flag: '🇩🇪', region: 'europe', homeCode: 'DE', vibe: '🍺 Culture & alps', bestMonths: [6,7,9,10,12], popularWith: ['europe','namerica'], blurb: 'Beer gardens and castles; Oktoberfest in autumn, markets at Christmas.' },
  { city: 'Berlin', country: 'Germany', flag: '🇩🇪', region: 'europe', homeCode: 'DE', vibe: '🎨 City & art', bestMonths: [5,6,7,9], popularWith: ['europe','namerica'], blurb: 'History, galleries, and an unmatched nightlife in the warm months.' },
  { city: 'Norwegian Fjords', country: 'Norway', flag: '🇳🇴', region: 'europe', vibe: '⛰️ Fjords', bestMonths: [6,7,8], popularWith: ['europe','namerica'], blurb: 'Cruise deep fjords under the midnight sun at the peak of summer.' },

  // ── North America ───────────────────────────────────────
  { city: 'New York City', country: 'USA', flag: '🇺🇸', region: 'namerica', homeCode: 'US', vibe: '🏙️ Big city', bestMonths: [4,5,6,9,10,12], popularWith: ['namerica','europe','apac','latam'], blurb: 'Spring blooms, autumn colour, and dazzling December holiday lights.' },
  { city: 'New Orleans', country: 'USA', flag: '🇺🇸', region: 'namerica', homeCode: 'US', vibe: '🎷 Food & music', bestMonths: [2,3,4,10,11], popularWith: ['namerica'], blurb: 'Jazz, Creole food, and festival season before the summer humidity.' },
  { city: 'Hawaii', country: 'USA', flag: '🌺', region: 'namerica', homeCode: 'US', vibe: '🏝️ Tropical', bestMonths: [1,2,3,4,9,10,12], popularWith: ['namerica','apac'], blurb: 'Volcanoes, surf, and waterfalls — driest and warmest outside mid-summer.' },
  { city: 'California Coast', country: 'USA', flag: '🇺🇸', region: 'namerica', homeCode: 'US', vibe: '🌉 Road trip', bestMonths: [5,6,9,10], popularWith: ['namerica','europe','apac'], blurb: 'San Francisco to Big Sur — clear skies and golden cliffs in shoulder season.' },
  { city: 'Miami & the Keys', country: 'USA', flag: '🇺🇸', region: 'namerica', homeCode: 'US', vibe: '🏖️ Beach', bestMonths: [12,1,2,3,4], popularWith: ['namerica','latam'], blurb: 'Art-deco beaches and turquoise water at their best over the dry winter.' },
  { city: 'Banff & the Rockies', country: 'Canada', flag: '🇨🇦', region: 'namerica', homeCode: 'CA', vibe: '🏔️ Mountains', bestMonths: [6,7,8,1,2], popularWith: ['namerica','apac','europe'], blurb: 'Turquoise lakes and hikes in summer; world-class skiing in deep winter.' },
  { city: 'Vancouver & Whistler', country: 'Canada', flag: '🇨🇦', region: 'namerica', homeCode: 'CA', vibe: '🌲 City & slopes', bestMonths: [12,1,2,7,8], popularWith: ['namerica','apac'], blurb: 'Rainforest-meets-ocean city; ski Whistler in winter, hike in summer.' },
  { city: 'Quebec City', country: 'Canada', flag: '🇨🇦', region: 'namerica', homeCode: 'CA', vibe: '🏰 Old-world charm', bestMonths: [6,7,8,12], popularWith: ['namerica','europe'], blurb: 'Cobblestoned French charm — summer terraces or a snow-globe Christmas.' },

  // ── Latin America ───────────────────────────────────────
  { city: 'Cancún & Tulum', country: 'Mexico', flag: '🇲🇽', region: 'latam', homeCode: 'MX', vibe: '🏖️ Beach', bestMonths: [12,1,2,3,4,11], popularWith: ['namerica','latam','europe'], blurb: 'Caribbean beaches and cenotes at their driest and sunniest over winter.' },
  { city: 'Mexico City', country: 'Mexico', flag: '🇲🇽', region: 'latam', homeCode: 'MX', vibe: '🌮 Culture & food', bestMonths: [3,4,5,10,11], popularWith: ['namerica','latam','europe'], blurb: 'World-class food, museums, and pyramids in the mild dry season.' },
  { city: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', region: 'latam', homeCode: 'BR', vibe: '🏖️ Beach & party', bestMonths: [12,1,2,3], popularWith: ['latam','europe','namerica'], blurb: 'Brazilian summer — Copacabana, Carnival energy, and Christ the Redeemer.' },
  { city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', region: 'latam', vibe: '💃 City & tango', bestMonths: [3,4,5,10,11], popularWith: ['latam','europe','namerica'], blurb: 'Tango, steak, and grand avenues — best in the mild autumn and spring.' },
  { city: 'Patagonia', country: 'Argentina / Chile', flag: '🏔️', region: 'latam', vibe: '🥾 Epic trekking', bestMonths: [12,1,2,3], popularWith: ['latam','europe','namerica'], blurb: 'Glaciers and granite peaks in the southern summer hiking window.' },
  { city: 'Cusco & Machu Picchu', country: 'Peru', flag: '🇵🇪', region: 'latam', vibe: '🏔️ Ruins & trek', bestMonths: [5,6,7,8,9], popularWith: ['latam','namerica','europe'], blurb: 'Dry season means clear Inca-trail views and reliable hiking weather.' },
  { city: 'Costa Rica', country: 'Costa Rica', flag: '🇨🇷', region: 'latam', vibe: '🌿 Jungle & wildlife', bestMonths: [12,1,2,3,4], popularWith: ['namerica','latam','europe'], blurb: 'Dry season for rainforests, volcanoes, and both coastlines.' },
  { city: 'Cartagena', country: 'Colombia', flag: '🇨🇴', region: 'latam', vibe: '🌴 Colonial & coast', bestMonths: [12,1,2,3], popularWith: ['namerica','latam'], blurb: 'Walled old town and Caribbean colour in the breezy dry season.' },
  { city: 'Galápagos', country: 'Ecuador', flag: '🐢', region: 'latam', vibe: '🐠 Wildlife', bestMonths: [6,7,8,12,1], popularWith: ['namerica','europe','latam'], blurb: 'Snorkel with sea lions and marine iguanas on a bucket-list voyage.' },

  // ── Asia-Pacific ────────────────────────────────────────
  { city: 'Tokyo & Kyoto', country: 'Japan', flag: '🇯🇵', region: 'apac', homeCode: 'JP', vibe: '🌸 Culture', bestMonths: [3,4,10,11], popularWith: ['apac','namerica','europe'], blurb: 'Cherry blossoms in spring, fiery maple leaves in autumn — Japan at its best.' },
  { city: 'Bali', country: 'Indonesia', flag: '🇮🇩', region: 'apac', vibe: '🌴 Island & temples', bestMonths: [4,5,6,7,8,9], popularWith: ['apac','europe'], blurb: 'Dry season delivers temples, rice terraces, and surf without the rain.' },
  { city: 'Bangkok & Phuket', country: 'Thailand', flag: '🇹🇭', region: 'apac', vibe: '🏖️ Beach & street food', bestMonths: [11,12,1,2,3], popularWith: ['apac','europe','namerica'], blurb: 'Cool dry season — golden temples, night markets, and island beaches.' },
  { city: 'Vietnam', country: 'Vietnam', flag: '🇻🇳', region: 'apac', vibe: '🍜 Culture & coast', bestMonths: [10,11,12,3,4], popularWith: ['apac','europe'], blurb: 'Halong Bay, Hoi An lanterns, and incredible food in the dry months.' },
  { city: 'Bora Bora', country: 'French Polynesia', flag: '🇵🇫', region: 'apac', vibe: '🐠 Overwater luxury', bestMonths: [5,6,7,8,9,10], popularWith: ['apac','namerica'], blurb: 'Dry season brings calm turquoise lagoons and perfect overwater-villa weather.' },
  { city: 'Queenstown', country: 'New Zealand', flag: '🇳🇿', region: 'apac', vibe: '🏔️ Adventure', bestMonths: [12,1,2,6,7,8], popularWith: ['apac','europe','namerica'], blurb: 'Summer hiking and lakes, or winter skiing in the Southern Alps.' },
  { city: 'Sydney', country: 'Australia', flag: '🇦🇺', region: 'apac', homeCode: 'AU', vibe: '🏖️ City & beach', bestMonths: [10,11,12,1,2,3], popularWith: ['apac','europe','namerica'], blurb: 'Harbour, Bondi, and warm beach days in the southern summer.' },
  { city: 'Great Barrier Reef', country: 'Australia', flag: '🇦🇺', region: 'apac', homeCode: 'AU', vibe: '🤿 Reef & sun', bestMonths: [6,7,8,9,10], popularWith: ['apac','europe','namerica'], blurb: 'Dry season brings clear water and calm seas for diving the reef.' },
  { city: 'Singapore', country: 'Singapore', flag: '🇸🇬', region: 'apac', homeCode: 'SG', vibe: '🏙️ City & food', bestMonths: [2,3,4,7,8], popularWith: ['apac','europe'], blurb: 'Futuristic gardens and hawker food — a slick stopover any time of year.' },
  { city: 'Goa', country: 'India', flag: '🇮🇳', region: 'apac', homeCode: 'IN', vibe: '🏖️ Beach', bestMonths: [11,12,1,2], popularWith: ['apac','europe'], blurb: 'Golden beaches and night markets in the cool, dry, breezy season.' },
  { city: 'Kerala', country: 'India', flag: '🇮🇳', region: 'apac', homeCode: 'IN', vibe: '🛶 Backwaters', bestMonths: [12,1,2,3], popularWith: ['apac','europe'], blurb: 'Houseboats, tea hills, and palm-lined backwaters in the dry months.' },
  { city: 'Rajasthan', country: 'India', flag: '🇮🇳', region: 'apac', homeCode: 'IN', vibe: '🕌 Palaces', bestMonths: [10,11,12,1,2], popularWith: ['apac','europe'], blurb: 'Jaipur and Udaipur forts in the comfortable cool-season window.' },
  { city: 'Maldives', country: 'Maldives', flag: '🇲🇻', region: 'apac', vibe: '🏝️ Overwater luxury', bestMonths: [11,12,1,2,3,4], popularWith: ['apac','europe'], blurb: 'Powder-white sand and overwater villas in the sunny dry season.' },
  { city: 'Seoul', country: 'South Korea', flag: '🇰🇷', region: 'apac', vibe: '🏙️ City & culture', bestMonths: [4,5,9,10], popularWith: ['apac','namerica'], blurb: 'Palaces, food, and K-culture under spring blossoms or crisp autumn skies.' },

  // ── Middle East ─────────────────────────────────────────
  { city: 'Dubai', country: 'UAE', flag: '🇦🇪', region: 'mideast', vibe: '🏙️ Luxury & desert', bestMonths: [11,12,1,2,3], popularWith: ['apac','europe','africa'], blurb: 'Cool season for skylines, desert safaris, and beach resorts.' },
  { city: 'Istanbul', country: 'Türkiye', flag: '🇹🇷', region: 'mideast', vibe: '🕌 History & bazaars', bestMonths: [4,5,6,9,10], popularWith: ['europe','apac','africa'], blurb: 'Mosques, markets, and the Bosphorus in the mild shoulder months.' },
  { city: 'Petra & Wadi Rum', country: 'Jordan', flag: '🇯🇴', region: 'mideast', vibe: '🏜️ Ruins & desert', bestMonths: [3,4,5,10,11], popularWith: ['europe','namerica','apac'], blurb: 'The rose-red city and red-sand desert at comfortable temperatures.' },

  // ── Africa ──────────────────────────────────────────────
  { city: 'Cape Town', country: 'South Africa', flag: '🇿🇦', region: 'africa', homeCode: 'ZA', vibe: '🏔️ Coast & wine', bestMonths: [11,12,1,2,3], popularWith: ['africa','europe','namerica'], blurb: 'Table Mountain, beaches, and winelands in the warm, dry southern summer.' },
  { city: 'Marrakech', country: 'Morocco', flag: '🇲🇦', region: 'africa', vibe: '🕌 Souks & desert', bestMonths: [3,4,5,10,11], popularWith: ['europe','africa','namerica'], blurb: 'Comfortable temperatures for medinas, riads, and a Sahara side-trip.' },
  { city: 'Serengeti', country: 'Tanzania', flag: '🇹🇿', region: 'africa', vibe: '🦁 Safari', bestMonths: [6,7,8,9,10], popularWith: ['africa','europe','namerica'], blurb: 'Dry season is prime game-viewing and the Great Migration crossings.' },
  { city: 'Zanzibar', country: 'Tanzania', flag: '🏝️', region: 'africa', vibe: '🏖️ Spice island', bestMonths: [6,7,8,9,1,2], popularWith: ['africa','europe'], blurb: 'White sand, turquoise water, and Stone Town in the dry seasons.' },
  { city: 'Egypt & the Nile', country: 'Egypt', flag: '🇪🇬', region: 'africa', vibe: '🏺 Ancient wonders', bestMonths: [10,11,12,1,2,3], popularWith: ['europe','africa','apac'], blurb: 'Pyramids and a Nile cruise in the cooler, comfortable winter months.' },
  { city: 'Mauritius', country: 'Mauritius', flag: '🇲🇺', region: 'africa', vibe: '🏝️ Island luxury', bestMonths: [5,6,7,8,9,10,11], popularWith: ['africa','europe','apac'], blurb: 'Lagoon beaches and reefs in the dry, sunny southern-winter window.' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function monthName(m) { return MONTH_NAMES[m - 1]; }

// originCountry: ISO code (e.g. 'US'). month: 1–12. tripDays: trip length.
export function recommendDestinations({ originCountry, month, tripDays = 7, limit = 6 }) {
  const originRegion = ORIGIN_REGION[originCountry] || null;
  const prevM = month === 1 ? 12 : month - 1;
  const nextM = month === 12 ? 1 : month + 1;
  const tier = tripDays <= 4 ? 'short' : tripDays <= 9 ? 'medium' : 'long';

  const scored = DESTINATIONS
    .filter(d => !(d.homeCode && d.homeCode === originCountry))  // don't recommend home
    .map(d => {
      let score = 0;
      let reason = null;

      const inSeason = d.bestMonths.includes(month);
      if (inSeason) { score += 4; reason = 'peak season'; }
      else if (d.bestMonths.includes(prevM) || d.bestMonths.includes(nextM)) score += 1.5;

      if (originRegion && d.popularWith.includes(originRegion)) score += 2.5;

      // Distance vs. trip length: short trips reward nearby, long trips reward far.
      const aff = originRegion ? (AFFINITY[originRegion]?.[d.region] ?? 0) : 1;
      if (tier === 'short') {
        score += aff * 1.5;
        if (aff === 0) score -= 2.5;            // too far for a quick break
        else if (aff === 2 && !reason) reason = 'quick getaway';
      } else if (tier === 'medium') {
        score += aff * 0.8;
      } else { // long
        if (aff === 0) { score += 2.2; if (!reason) reason = 'worth the long haul'; }
        else if (aff === 2) score -= 0.5;        // don't burn a long trip nearby
        else score += 0.3;
      }

      if (!reason && originRegion && d.popularWith.includes(originRegion)) reason = 'popular from home';

      return { ...d, score, inSeason, reason };
    });

  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score || (b.inSeason - a.inSeason))
    .slice(0, limit);
}
