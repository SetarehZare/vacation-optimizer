// Country metadata: name, flag emoji, region map.
// Holiday dates are fetched live from the backend API.
export const COUNTRY_META = {
  US: {
    name: 'United States', flag: '🇺🇸',
    regions: {
      AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
      CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
      HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
      KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
      MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',
      MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
      NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
      OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
      SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
      VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
    },
  },
  CA: {
    name: 'Canada', flag: '🇨🇦',
    regions: {
      AB:'Alberta',BC:'British Columbia',MB:'Manitoba',NB:'New Brunswick',
      NL:'Newfoundland & Labrador',NS:'Nova Scotia',NT:'Northwest Territories',
      NU:'Nunavut',ON:'Ontario',PE:'Prince Edward Island',QC:'Quebec',
      SK:'Saskatchewan',YT:'Yukon',
    },
  },
  GB: {
    name: 'United Kingdom', flag: '🇬🇧',
    regions: { ENG:'England', WLS:'Wales', SCT:'Scotland', NIR:'Northern Ireland' },
  },
  AU: {
    name: 'Australia', flag: '🇦🇺',
    regions: {
      ACT:'Australian Capital Territory',NSW:'New South Wales',NT:'Northern Territory',
      QLD:'Queensland',SA:'South Australia',TAS:'Tasmania',VIC:'Victoria',WA:'Western Australia',
    },
  },
  DE: {
    name: 'Germany', flag: '🇩🇪',
    regions: {
      BW:'Baden-Württemberg',BY:'Bavaria',BE:'Berlin',BB:'Brandenburg',
      HB:'Bremen',HH:'Hamburg',HE:'Hesse',MV:'Mecklenburg-Vorpommern',
      NI:'Lower Saxony',NW:'North Rhine-Westphalia',RP:'Rhineland-Palatinate',
      SL:'Saarland',SN:'Saxony',ST:'Saxony-Anhalt',SH:'Schleswig-Holstein',TH:'Thuringia',
    },
  },
  FR: { name: 'France',       flag: '🇫🇷', regions: null },
  ES: { name: 'Spain',        flag: '🇪🇸', regions: null },
  IT: { name: 'Italy',        flag: '🇮🇹', regions: null },
  NL: { name: 'Netherlands',  flag: '🇳🇱', regions: null },
  JP: { name: 'Japan',        flag: '🇯🇵', regions: null },
  IN: { name: 'India',        flag: '🇮🇳', regions: null },
  MX: { name: 'Mexico',       flag: '🇲🇽', regions: null },
  BR: { name: 'Brazil',       flag: '🇧🇷', regions: null },
  ZA: { name: 'South Africa', flag: '🇿🇦', regions: null },
  SG: { name: 'Singapore',    flag: '🇸🇬', regions: null },
  IE: { name: 'Ireland',      flag: '🇮🇪', regions: null },
};
