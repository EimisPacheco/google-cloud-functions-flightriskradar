export interface Airline {
  code: string;
  name: string;
  country: string;
  onTimeRate?: number;
  website?: string;
  rating?: number;
}

export const US_AIRLINES: Airline[] = [
  // Major US airlines
  { code: "AA", name: "American Airlines", country: "United States", onTimeRate: 78.2, website: "https://www.aa.com", rating: 3.8 },
  { code: "DL", name: "Delta Air Lines", country: "United States", onTimeRate: 83.1, website: "https://www.delta.com", rating: 4.1 },
  { code: "UA", name: "United Airlines", country: "United States", onTimeRate: 80.4, website: "https://www.united.com", rating: 3.9 },
  { code: "WN", name: "Southwest Airlines", country: "United States", onTimeRate: 73.8, website: "https://www.southwest.com", rating: 4.2 },
  { code: "B6", name: "JetBlue Airways", country: "United States", onTimeRate: 69.5, website: "https://www.jetblue.com", rating: 3.7 },
  { code: "AS", name: "Alaska Airlines", country: "United States", onTimeRate: 81.2, website: "https://www.alaskaair.com", rating: 4.0 },
  { code: "NK", name: "Spirit Airlines", country: "United States", onTimeRate: 65.3, website: "https://www.spirit.com", rating: 3.2 },
  { code: "F9", name: "Frontier Airlines", country: "United States", onTimeRate: 67.1, website: "https://www.flyfrontier.com", rating: 3.3 },
  { code: "G4", name: "Allegiant Air", country: "United States", onTimeRate: 72.4, website: "https://www.allegiantair.com", rating: 3.5 },
  { code: "HA", name: "Hawaiian Airlines", country: "United States", onTimeRate: 85.7, website: "https://www.hawaiianairlines.com", rating: 4.3 },
  
  // Regional and smaller carriers
  { code: "MQ", name: "Envoy Air", country: "United States" },
  { code: "OO", name: "SkyWest Airlines", country: "United States" },
  { code: "YX", name: "Republic Airlines", country: "United States" },
  { code: "9E", name: "Endeavor Air", country: "United States" },
  { code: "EV", name: "ExpressJet Airlines", country: "United States" },
  { code: "QX", name: "Horizon Air", country: "United States" },
  { code: "YV", name: "Mesa Airlines", country: "United States" },
  { code: "PT", name: "Piedmont Airlines", country: "United States" },
  { code: "OH", name: "PSA Airlines", country: "United States" },
  { code: "AX", name: "Trans States Airlines", country: "United States" },
  { code: "ZW", name: "Air Wisconsin", country: "United States" },
  { code: "G7", name: "GoJet Airlines", country: "United States" },
  { code: "CP", name: "Compass Airlines", country: "United States" },
  { code: "EM", name: "Empire Airlines", country: "United States" },
  
  // Cargo airlines
  { code: "FX", name: "FedEx Express", country: "United States" },
  { code: "5X", name: "UPS Airlines", country: "United States" },
  { code: "ATI", name: "Air Transport International", country: "United States" },
  { code: "ABX", name: "ABX Air", country: "United States" },
  { code: "KAL", name: "Kalitta Air", country: "United States" },
  
  // Charter and other airlines
  { code: "SBU", name: "Swift Air", country: "United States" },
  { code: "CKS", name: "Kalitta Charters", country: "United States" },
  { code: "CJT", name: "Cargojet Airways", country: "United States" },
  { code: "XSR", name: "Executive Fliteways", country: "United States" },
  { code: "TTA", name: "iTACA", country: "United States" },
  
  // Low-cost carriers
  { code: "SY", name: "Sun Country Airlines", country: "United States" },
  { code: "VX", name: "Virgin America", country: "United States" },
  { code: "FL", name: "AirTran Airways", country: "United States" },
  
  // Regional carriers
  { code: "C5", name: "Champlain Air", country: "United States" },
  { code: "KS", name: "PenAir", country: "United States" },
  { code: "LOF", name: "Trans States Holdings", country: "United States" },
  { code: "JIA", name: "Jetstream International Airlines", country: "United States" },
  { code: "GJS", name: "GoJet Airlines", country: "United States" },
  { code: "CFS", name: "Empire Airlines", country: "United States" },
  { code: "EDV", name: "Endeavor Air", country: "United States" },
  { code: "ENY", name: "Envoy Air", country: "United States" },
  { code: "ASQ", name: "ExpressJet Airlines", country: "United States" },
  { code: "FFT", name: "Frontier Airlines", country: "United States" },
  { code: "HAL", name: "Hawaiian Airlines", country: "United States" },
  { code: "QXE", name: "Horizon Air", country: "United States" },
  { code: "JBU", name: "JetBlue Airways", country: "United States" },
  { code: "ASH", name: "Mesa Airlines", country: "United States" },
  { code: "NLA", name: "PenAir", country: "United States" },
  { code: "PDT", name: "Piedmont Airlines", country: "United States" },
  { code: "RPA", name: "Republic Airlines", country: "United States" },
  { code: "SKW", name: "SkyWest Airlines", country: "United States" },
  { code: "SWA", name: "Southwest Airlines", country: "United States" },
  { code: "NKS", name: "Spirit Airlines", country: "United States" },
  { code: "UAL", name: "United Airlines", country: "United States" },
  { code: "AAL", name: "American Airlines", country: "United States" },
  { code: "DAL", name: "Delta Air Lines", country: "United States" },
  { code: "ASA", name: "Alaska Airlines", country: "United States" },
  { code: "AAY", name: "Allegiant Air", country: "United States" },
  { code: "UCA", name: "Champlain Air", country: "United States" },
  { code: "CPZ", name: "Compass Airlines", country: "United States" },
  { code: "AWI", name: "Air Wisconsin", country: "United States" }
];

export const searchAirlines = (query: string): Airline[] => {
  const searchTerm = query.toLowerCase().trim();
  
  if (searchTerm.length < 1) return [];
  
  return US_AIRLINES.filter(airline => 
    airline.name.toLowerCase().includes(searchTerm) ||
    airline.code.toLowerCase().includes(searchTerm)
  ).slice(0, 10);
};

export const formatAirlineDisplay = (airline: Airline): string => {
  return `${airline.name} (${airline.code})`;
};

export const getAirlineOnTimeRate = (airlineInput: string): number | null => {
  // Try to find by airline code first
  let airline = US_AIRLINES.find(a => a.code === airlineInput.toUpperCase());
  
  // If not found by code, try to find by airline name
  if (!airline) {
    airline = US_AIRLINES.find(a => 
      a.name.toLowerCase() === airlineInput.toLowerCase() ||
      a.name.toLowerCase().includes(airlineInput.toLowerCase())
    );
  }
  
  return airline?.onTimeRate || null;
};

export const getAirlineWebsite = (airlineInput: string): string | null => {
  // Try to find by airline code first
  let airline = US_AIRLINES.find(a => a.code === airlineInput.toUpperCase());
  
  // If not found by code, try to find by airline name
  if (!airline) {
    airline = US_AIRLINES.find(a => 
      a.name.toLowerCase() === airlineInput.toLowerCase() ||
      a.name.toLowerCase().includes(airlineInput.toLowerCase())
    );
  }
  
  return airline?.website || null;
};

export const getAirlineRating = (airlineInput: string): number | null => {
  // Try to find by airline code first
  let airline = US_AIRLINES.find(a => a.code === airlineInput.toUpperCase());
  
  // If not found by code, try to find by airline name
  if (!airline) {
    airline = US_AIRLINES.find(a => 
      a.name.toLowerCase() === airlineInput.toLowerCase() ||
      a.name.toLowerCase().includes(airlineInput.toLowerCase())
    );
  }
  
  return airline?.rating || null;
}; 

export const getAirlineCode = (input: string): string => {
  const search = input.trim().toLowerCase();
  const found = US_AIRLINES.find(a =>
    a.code.toLowerCase() === search || a.name.toLowerCase() === search
  );
  return found ? found.code : input;
}; 