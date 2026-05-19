// countryData.js

export const countries = [
  // === ALL 27 EUROPEAN UNION COUNTRIES (GDPR APPLIES) ===
  { name: "Austria", timezone: "Europe/Vienna", isEU: true },
  { name: "Belgium", timezone: "Europe/Brussels", isEU: true },
  { name: "Bulgaria", timezone: "Europe/Sofia", isEU: true },
  { name: "Croatia", timezone: "Europe/Zagreb", isEU: true },
  { name: "Cyprus", timezone: "Asia/Nicosia", isEU: true },
  { name: "Czech Republic", timezone: "Europe/Prague", isEU: true },
  { name: "Denmark", timezone: "Europe/Copenhagen", isEU: true },
  { name: "Estonia", timezone: "Europe/Tallinn", isEU: true },
  { name: "Finland", timezone: "Europe/Helsinki", isEU: true },
  { name: "France", timezone: "Europe/Paris", isEU: true },
  { name: "Germany", timezone: "Europe/Berlin", isEU: true },
  { name: "Greece", timezone: "Europe/Athens", isEU: true },
  { name: "Hungary", timezone: "Europe/Budapest", isEU: true },
  { name: "Ireland", timezone: "Europe/Dublin", isEU: true },
  { name: "Italy", timezone: "Europe/Rome", isEU: true },
  { name: "Latvia", timezone: "Europe/Riga", isEU: true },
  { name: "Lithuania", timezone: "Europe/Vilnius", isEU: true },
  { name: "Luxembourg", timezone: "Europe/Luxembourg", isEU: true },
  { name: "Malta", timezone: "Europe/Malta", isEU: true },
  { name: "Netherlands", timezone: "Europe/Amsterdam", isEU: true },
  { name: "Poland", timezone: "Europe/Warsaw", isEU: true },
  { name: "Portugal", timezone: "Europe/Lisbon", isEU: true },
  { name: "Romania", timezone: "Europe/Bucharest", isEU: true },
  { name: "Slovakia", timezone: "Europe/Bratislava", isEU: true },
  { name: "Slovenia", timezone: "Europe/Ljubljana", isEU: true },
  { name: "Spain", timezone: "Europe/Madrid", isEU: true },
  { name: "Sweden", timezone: "Europe/Stockholm", isEU: true },

  // === MAJOR NON-EU EUROPEAN COUNTRIES ===
  { name: "United Kingdom", timezone: "Europe/London", isEU: false },
  { name: "Switzerland", timezone: "Europe/Zurich", isEU: false },
  { name: "Norway", timezone: "Europe/Oslo", isEU: false },
  { name: "Serbia", timezone: "Europe/Belgrade", isEU: false },
  { name: "Ukraine", timezone: "Europe/Kiev", isEU: false },

  // === NORTH AMERICA ===
  { name: "United States (Eastern - NY)", timezone: "America/New_York", isEU: false },
  { name: "United States (Central - Chicago)", timezone: "America/Chicago", isEU: false },
  { name: "United States (Mountain - Denver)", timezone: "America/Denver", isEU: false },
  { name: "United States (Pacific - LA)", timezone: "America/Los_Angeles", isEU: false },
  { name: "Canada (Eastern - Toronto)", timezone: "America/Toronto", isEU: false },
  { name: "Canada (Pacific - Vancouver)", timezone: "America/Vancouver", isEU: false },
  { name: "Mexico (Mexico City)", timezone: "America/Mexico_City", isEU: false },

  // === SOUTH & CENTRAL AMERICA ===
  { name: "Brazil (São Paulo)", timezone: "America/Sao_Paulo", isEU: false },
  { name: "Argentina (Buenos Aires)", timezone: "America/Argentina/Buenos_Aires", isEU: false },
  { name: "Colombia (Bogotá)", timezone: "America/Bogota", isEU: false },
  { name: "Chile (Santiago)", timezone: "America/Santiago", isEU: false },
  { name: "Peru (Lima)", timezone: "America/Lima", isEU: false },

  // === ASIA & MIDDLE EAST ===
  { name: "China (Beijing)", timezone: "Asia/Shanghai", isEU: false },
  { name: "Japan (Tokyo)", timezone: "Asia/Tokyo", isEU: false },
  { name: "India", timezone: "Asia/Kolkata", isEU: false },
  { name: "South Korea (Seoul)", timezone: "Asia/Seoul", isEU: false },
  { name: "Indonesia (Jakarta)", timezone: "Asia/Jakarta", isEU: false },
  { name: "Philippines (Manila)", timezone: "Asia/Manila", isEU: false },
  { name: "Vietnam (Ho Chi Minh)", timezone: "Asia/Ho_Chi_Minh", isEU: false },
  { name: "Thailand (Bangkok)", timezone: "Asia/Bangkok", isEU: false },
  { name: "Singapore", timezone: "Asia/Singapore", isEU: false },
  { name: "Malaysia (Kuala Lumpur)", timezone: "Asia/Kuala_Lumpur", isEU: false },
  { name: "United Arab Emirates (Dubai)", timezone: "Asia/Dubai", isEU: false },
  { name: "Saudi Arabia (Riyadh)", timezone: "Asia/Riyadh", isEU: false },
  { name: "Israel (Tel Aviv)", timezone: "Asia/Jerusalem", isEU: false },
  { name: "Turkey (Istanbul)", timezone: "Europe/Istanbul", isEU: false },

  // === AFRICA ===
  { name: "South Africa (Johannesburg)", timezone: "Africa/Johannesburg", isEU: false },
  { name: "Nigeria (Lagos)", timezone: "Africa/Lagos", isEU: false },
  { name: "Egypt (Cairo)", timezone: "Africa/Cairo", isEU: false },
  { name: "Kenya (Nairobi)", timezone: "Africa/Nairobi", isEU: false },
  { name: "Morocco (Casablanca)", timezone: "Africa/Casablanca", isEU: false },

  // === OCEANIA ===
  { name: "Australia (Sydney - East)", timezone: "Australia/Sydney", isEU: false },
  { name: "Australia (Perth - West)", timezone: "Australia/Perth", isEU: false },
  { name: "New Zealand (Auckland)", timezone: "Pacific/Auckland", isEU: false }
];
