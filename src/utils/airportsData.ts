export interface Airport {
  code: string;
  name: string;
  city: string;
  state: string;
  country: string;
}

export const US_AIRPORTS: Airport[] = [
  // Major airports
  { code: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", state: "GA", country: "United States" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", state: "CA", country: "United States" },
  { code: "ORD", name: "Chicago O'Hare International Airport", city: "Chicago", state: "IL", country: "United States" },
  { code: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", state: "TX", country: "United States" },
  { code: "DEN", name: "Denver International Airport", city: "Denver", state: "CO", country: "United States" },
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", state: "NY", country: "United States" },
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco", state: "CA", country: "United States" },
  { code: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", state: "WA", country: "United States" },
  { code: "LAS", name: "McCarran International Airport", city: "Las Vegas", state: "NV", country: "United States" },
  { code: "BOS", name: "Boston Logan International Airport", city: "Boston", state: "MA", country: "United States" },
  { code: "EWR", name: "Newark Liberty International Airport", city: "Newark", state: "NJ", country: "United States" },
  { code: "LGA", name: "LaGuardia Airport", city: "New York", state: "NY", country: "United States" },
  { code: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte", state: "NC", country: "United States" },
  { code: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", state: "AZ", country: "United States" },
  { code: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", state: "TX", country: "United States" },
  { code: "MIA", name: "Miami International Airport", city: "Miami", state: "FL", country: "United States" },
  { code: "MCO", name: "Orlando International Airport", city: "Orlando", state: "FL", country: "United States" },
  { code: "MSP", name: "Minneapolis-St. Paul International Airport", city: "Minneapolis", state: "MN", country: "United States" },
  { code: "DTW", name: "Detroit Metropolitan Airport", city: "Detroit", state: "MI", country: "United States" },
  { code: "PHL", name: "Philadelphia International Airport", city: "Philadelphia", state: "PA", country: "United States" },
  { code: "BWI", name: "Baltimore/Washington International Airport", city: "Baltimore", state: "MD", country: "United States" },
  { code: "SAN", name: "San Diego International Airport", city: "San Diego", state: "CA", country: "United States" },
  { code: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington", state: "DC", country: "United States" },
  { code: "IAD", name: "Washington Dulles International Airport", city: "Washington", state: "DC", country: "United States" },
  { code: "TPA", name: "Tampa International Airport", city: "Tampa", state: "FL", country: "United States" },
  { code: "PDX", name: "Portland International Airport", city: "Portland", state: "OR", country: "United States" },
  { code: "STL", name: "Lambert-St. Louis International Airport", city: "St. Louis", state: "MO", country: "United States" },
  { code: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu", state: "HI", country: "United States" },
  { code: "DAL", name: "Dallas Love Field", city: "Dallas", state: "TX", country: "United States" },
  { code: "MDW", name: "Chicago Midway International Airport", city: "Chicago", state: "IL", country: "United States" },
  { code: "BNA", name: "Nashville International Airport", city: "Nashville", state: "TN", country: "United States" },
  { code: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin", state: "TX", country: "United States" },
  { code: "MCI", name: "Kansas City International Airport", city: "Kansas City", state: "MO", country: "United States" },
  { code: "CVG", name: "Cincinnati/Northern Kentucky International Airport", city: "Cincinnati", state: "OH", country: "United States" },
  { code: "SLC", name: "Salt Lake City International Airport", city: "Salt Lake City", state: "UT", country: "United States" },
  { code: "CLE", name: "Cleveland Hopkins International Airport", city: "Cleveland", state: "OH", country: "United States" },
  { code: "SJC", name: "San Jose International Airport", city: "San Jose", state: "CA", country: "United States" },
  { code: "SMF", name: "Sacramento International Airport", city: "Sacramento", state: "CA", country: "United States" },
  { code: "OAK", name: "Oakland International Airport", city: "Oakland", state: "CA", country: "United States" },
  { code: "SNA", name: "John Wayne Airport", city: "Santa Ana", state: "CA", country: "United States" },
  { code: "RDU", name: "Raleigh-Durham International Airport", city: "Raleigh", state: "NC", country: "United States" },
  { code: "IND", name: "Indianapolis International Airport", city: "Indianapolis", state: "IN", country: "United States" },
  { code: "CMH", name: "Port Columbus International Airport", city: "Columbus", state: "OH", country: "United States" },
  { code: "JAX", name: "Jacksonville International Airport", city: "Jacksonville", state: "FL", country: "United States" },
  { code: "RSW", name: "Southwest Florida International Airport", city: "Fort Myers", state: "FL", country: "United States" },
  { code: "COS", name: "City of Colorado Springs Municipal Airport", city: "Colorado Springs", state: "CO", country: "United States" },
  { code: "PIT", name: "Pittsburgh International Airport", city: "Pittsburgh", state: "PA", country: "United States" },
  { code: "BUF", name: "Buffalo Niagara International Airport", city: "Buffalo", state: "NY", country: "United States" },
  { code: "BUR", name: "Hollywood Burbank Airport", city: "Burbank", state: "CA", country: "United States" },
  { code: "ABQ", name: "Albuquerque International Sunport", city: "Albuquerque", state: "NM", country: "United States" },
  { code: "LGB", name: "Long Beach Airport", city: "Long Beach", state: "CA", country: "United States" },
  { code: "ONT", name: "Ontario International Airport", city: "Ontario", state: "CA", country: "United States" },
  { code: "OGG", name: "Kahului Airport", city: "Kahului", state: "HI", country: "United States" },
  { code: "KOA", name: "Ellison Onizuka Kona International Airport", city: "Kona", state: "HI", country: "United States" },
  { code: "MKE", name: "General Mitchell International Airport", city: "Milwaukee", state: "WI", country: "United States" },
  { code: "OMA", name: "Eppley Airfield", city: "Omaha", state: "NE", country: "United States" },
  { code: "OKC", name: "Will Rogers World Airport", city: "Oklahoma City", state: "OK", country: "United States" },
  { code: "TUL", name: "Tulsa International Airport", city: "Tulsa", state: "OK", country: "United States" },
  { code: "ICT", name: "Wichita Dwight D. Eisenhower National Airport", city: "Wichita", state: "KS", country: "United States" },
  { code: "DSM", name: "Des Moines International Airport", city: "Des Moines", state: "IA", country: "United States" },
  { code: "ROC", name: "Greater Rochester International Airport", city: "Rochester", state: "NY", country: "United States" },
  { code: "ALB", name: "Albany International Airport", city: "Albany", state: "NY", country: "United States" },
  { code: "SYR", name: "Syracuse Hancock International Airport", city: "Syracuse", state: "NY", country: "United States" },
  { code: "PVD", name: "T.F. Green Airport", city: "Providence", state: "RI", country: "United States" },
  { code: "BDL", name: "Bradley International Airport", city: "Hartford", state: "CT", country: "United States" },
  { code: "PWM", name: "Portland International Jetport", city: "Portland", state: "ME", country: "United States" },
  { code: "BGR", name: "Bangor International Airport", city: "Bangor", state: "ME", country: "United States" },
  { code: "MHT", name: "Manchester-Boston Regional Airport", city: "Manchester", state: "NH", country: "United States" },
  { code: "BTV", name: "Burlington International Airport", city: "Burlington", state: "VT", country: "United States" },
  { code: "GRR", name: "Gerald R. Ford International Airport", city: "Grand Rapids", state: "MI", country: "United States" },
  { code: "FNT", name: "Bishop International Airport", city: "Flint", state: "MI", country: "United States" },
  { code: "LAN", name: "Lansing Capital City Airport", city: "Lansing", state: "MI", country: "United States" },
  { code: "MSN", name: "Dane County Regional Airport", city: "Madison", state: "WI", country: "United States" },
  { code: "GRB", name: "Austin Straubel International Airport", city: "Green Bay", state: "WI", country: "United States" },
  { code: "FAR", name: "Hector International Airport", city: "Fargo", state: "ND", country: "United States" },
  { code: "BIS", name: "Bismarck Municipal Airport", city: "Bismarck", state: "ND", country: "United States" },
  { code: "FSD", name: "Sioux Falls Regional Airport", city: "Sioux Falls", state: "SD", country: "United States" },
  { code: "RAP", name: "Rapid City Regional Airport", city: "Rapid City", state: "SD", country: "United States" },
  { code: "BIL", name: "Billings Logan International Airport", city: "Billings", state: "MT", country: "United States" },
  { code: "MSO", name: "Missoula International Airport", city: "Missoula", state: "MT", country: "United States" },
  { code: "GTF", name: "Great Falls International Airport", city: "Great Falls", state: "MT", country: "United States" },
  { code: "BOI", name: "Boise Airport", city: "Boise", state: "ID", country: "United States" },
  { code: "GEG", name: "Spokane International Airport", city: "Spokane", state: "WA", country: "United States" },
  { code: "ANC", name: "Ted Stevens Anchorage International Airport", city: "Anchorage", state: "AK", country: "United States" },
  { code: "FAI", name: "Fairbanks International Airport", city: "Fairbanks", state: "AK", country: "United States" },
  { code: "JNU", name: "Juneau International Airport", city: "Juneau", state: "AK", country: "United States" }
];

export const searchAirports = (query: string): Airport[] => {
  const searchTerm = query.toLowerCase().trim();
  
  if (searchTerm.length < 2) return [];
  
  return US_AIRPORTS.filter(airport => 
    airport.city.toLowerCase().includes(searchTerm) ||
    airport.name.toLowerCase().includes(searchTerm) ||
    airport.code.toLowerCase().includes(searchTerm) ||
    airport.state.toLowerCase().includes(searchTerm)
  ).slice(0, 10);
};

export const formatAirportDisplay = (airport: Airport): string => {
  return `${airport.city} (${airport.code}) - ${airport.name}`;
}; 

// Extract city name from airport code for airports not in the main dataset
export const extractCityFromAirportCode = (code: string): string => {
  // First try to find in our main airport dataset
  const airport = US_AIRPORTS.find(a => a.code === code);
  if (airport) {
    return airport.city;
  }
  
  // Fallback mapping for common airports not in the main dataset
  const cityMappings: { [key: string]: string } = {
    'JFK': 'New York',
    'SFO': 'San Francisco', 
    'LAX': 'Los Angeles',
    'ORD': 'Chicago',
    'DFW': 'Dallas',
    'ATL': 'Atlanta',
    'DEN': 'Denver',
    'SEA': 'Seattle',
    'LAS': 'Las Vegas',
    'IAD': 'Washington',
    'DCA': 'Washington',
    'LGA': 'New York',
    'BWI': 'Baltimore',
    'MDW': 'Chicago',
    'SAN': 'San Diego',
    'TPA': 'Tampa',
    'PDX': 'Portland',
    'AUS': 'Austin',
    'CLT': 'Charlotte',
    'MSP': 'Minneapolis',
    'DTW': 'Detroit',
    'BOS': 'Boston',
    'FLL': 'Fort Lauderdale',
    'SJC': 'San Jose',
    'HNL': 'Honolulu',
    'ANC': 'Anchorage'
  };
  return cityMappings[code] || code;
}; 