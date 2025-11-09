// Aircraft model data mapping
export interface AircraftInfo {
  name: string;
  manufacturer: string;
  imageId: string; // Filename in Google Storage
  capacity: string;
  range: string;
  cruiseSpeed: string;
  firstFlight: string;
  description: string;
}

// Map common aircraft model variations to standardized names
export const aircraftModelMap: { [key: string]: string } = {
  // Boeing aircraft
  'Boeing 737': 'B737',
  'Boeing 737-800': 'B737',
  'Boeing 737-900': 'B737',
  'Boeing 737-700': 'B737',
  'Boeing 737 MAX': 'B737MAX',
  'Boeing 737 MAX 8': 'B737MAX',
  'Boeing 737 MAX 9': 'B737MAX',
  'Boeing 737MAX': 'B737MAX',
  'Boeing 737MAX 8': 'B737MAX',
  'Boeing 737MAX 9': 'B737MAX',
  'Boeing 737MAX 8 Passenger': 'B737MAX',
  'Boeing 737MAX 9 Passenger': 'B737MAX',
  'Boeing 747': 'B747',
  'Boeing 747-400': 'B747',
  'Boeing 747-8': 'B747',
  'Boeing 757': 'B757',
  'Boeing 757-200': 'B757',
  'Boeing 757-300': 'B757',
  'Boeing 767': 'B767',
  'Boeing 767-300': 'B767',
  'Boeing 767-400': 'B767',
  'Boeing 777': 'B777',
  'Boeing 777-200': 'B777',
  'Boeing 777-300': 'B777',
  'Boeing 777-300ER': 'B777',
  'Boeing 787': 'B787',
  'Boeing 787-8': 'B787',
  'Boeing 787-9': 'B787',
  'Boeing 787-10': 'B787',
  'Boeing 787 Dreamliner': 'B787',
  
  // Airbus aircraft
  'Airbus A319': 'A319',
  'Airbus A320': 'A320',
  'Airbus A321': 'A321',
  'Airbus A320neo': 'A320NEO',
  'Airbus A321neo': 'A321NEO',
  'Airbus A320 neo': 'A320NEO',
  'Airbus A321 neo': 'A321NEO',
  'A320neo': 'A320NEO',
  'A321neo': 'A321NEO',
  'Airbus A330': 'A330',
  'Airbus A330-200': 'A330',
  'Airbus A330-300': 'A330',
  'Airbus A340': 'A340',
  'Airbus A350': 'A350',
  'Airbus A350-900': 'A350',
  'Airbus A350-1000': 'A350',
  'Airbus A380': 'A380',
  
  // Embraer aircraft
  'Embraer E175': 'E175',
  'Embraer E190': 'E190',
  'Embraer E195': 'E195',
  'Embraer ERJ-145': 'ERJ145',
  'Embraer ERJ-175': 'E175',
  
  // Bombardier aircraft
  'Bombardier CRJ200': 'CRJ200',
  'Bombardier CRJ700': 'CRJ700',
  'Bombardier CRJ900': 'CRJ900',
  'Canadair Regional Jet': 'CRJ',
  
  // Other aircraft
  'McDonnell Douglas MD-80': 'MD80',
  'McDonnell Douglas MD-88': 'MD80',
  'McDonnell Douglas MD-90': 'MD90',
  'ATR 72': 'ATR72',
  'ATR 42': 'ATR42',
  'Dash 8': 'DASH8',
  'DHC-8': 'DASH8',
  
  // Generic mappings
  '737': 'B737',
  '747': 'B747',
  '757': 'B757',
  '767': 'B767',
  '777': 'B777',
  '787': 'B787',
  'A319': 'A319',
  'A320': 'A320',
  'A321': 'A321',
  'A330': 'A330',
  'A340': 'A340',
  'A350': 'A350',
  'A380': 'A380',
};

// Detailed aircraft information
export const aircraftInfo: { [key: string]: AircraftInfo } = {
  'B737': {
    name: 'Boeing 737',
    manufacturer: 'Boeing',
    imageId: 'boeing-737.jpg',
    capacity: '85-215 passengers',
    range: '2,935-3,825 nm',
    cruiseSpeed: 'Mach 0.79',
    firstFlight: '1967',
    description: 'The Boeing 737 is the best-selling commercial jetliner in history, known for its reliability and efficiency in short to medium-haul flights.'
  },
  'B737MAX': {
    name: 'Boeing 737 MAX',
    manufacturer: 'Boeing',
    imageId: 'boeing-737-max.jpg',
    capacity: '138-230 passengers',
    range: '3,550 nm',
    cruiseSpeed: 'Mach 0.79',
    firstFlight: '2016',
    description: 'The 737 MAX is the fourth generation of the Boeing 737, featuring new engines and improved aerodynamics for better fuel efficiency.'
  },
  'B747': {
    name: 'Boeing 747',
    manufacturer: 'Boeing',
    imageId: 'boeing-747.jpg',
    capacity: '416-660 passengers',
    range: '7,730 nm',
    cruiseSpeed: 'Mach 0.855',
    firstFlight: '1969',
    description: 'The iconic "Queen of the Skies," the Boeing 747 was the first wide-body airliner and revolutionized long-haul travel.'
  },
  'B757': {
    name: 'Boeing 757',
    manufacturer: 'Boeing',
    imageId: 'boeing-757.jpg',
    capacity: '200-295 passengers',
    range: '3,915 nm',
    cruiseSpeed: 'Mach 0.80',
    firstFlight: '1982',
    description: 'A narrow-body airliner designed for medium-haul routes, known for its powerful engines and excellent performance.'
  },
  'B767': {
    name: 'Boeing 767',
    manufacturer: 'Boeing',
    imageId: 'boeing-767.jpg',
    capacity: '181-375 passengers',
    range: '6,385 nm',
    cruiseSpeed: 'Mach 0.80',
    firstFlight: '1981',
    description: 'A mid-size, wide-body twin-engine jet airliner, popular for transcontinental and transatlantic routes.'
  },
  'B777': {
    name: 'Boeing 777',
    manufacturer: 'Boeing',
    imageId: 'boeing-777.jpg',
    capacity: '314-396 passengers',
    range: '8,555 nm',
    cruiseSpeed: 'Mach 0.84',
    firstFlight: '1994',
    description: 'The world\'s largest twinjet, known for its range, efficiency, and passenger comfort on long-haul routes.'
  },
  'B787': {
    name: 'Boeing 787 Dreamliner',
    manufacturer: 'Boeing',
    imageId: 'boeing-787.jpg',
    capacity: '242-335 passengers',
    range: '7,355-7,635 nm',
    cruiseSpeed: 'Mach 0.85',
    firstFlight: '2009',
    description: 'A super-efficient airplane with composite materials, featuring improved passenger comfort and fuel efficiency.'
  },
  'A319': {
    name: 'Airbus A319',
    manufacturer: 'Airbus',
    imageId: 'airbus-a319.jpg',
    capacity: '124-156 passengers',
    range: '3,750 nm',
    cruiseSpeed: 'Mach 0.78',
    firstFlight: '1995',
    description: 'The smallest member of the A320 family, popular for short to medium-haul routes.'
  },
  'A320': {
    name: 'Airbus A320',
    manufacturer: 'Airbus',
    imageId: 'airbus-a320.jpg',
    capacity: '150-186 passengers',
    range: '3,300 nm',
    cruiseSpeed: 'Mach 0.78',
    firstFlight: '1987',
    description: 'The first airliner with digital fly-by-wire controls, setting new standards in efficiency and comfort.'
  },
  'A321': {
    name: 'Airbus A321',
    manufacturer: 'Airbus',
    imageId: 'airbus-a321.jpg',
    capacity: '185-236 passengers',
    range: '3,200 nm',
    cruiseSpeed: 'Mach 0.78',
    firstFlight: '1993',
    description: 'The stretched version of the A320, offering increased capacity while maintaining operational efficiency.'
  },
  'A320NEO': {
    name: 'Airbus A320neo',
    manufacturer: 'Airbus',
    imageId: 'airbus-a320neo.jpg',
    capacity: '150-186 passengers',
    range: '3,500 nm',
    cruiseSpeed: 'Mach 0.78',
    firstFlight: '2014',
    description: 'The "new engine option" variant of the A320, offering 15-20% better fuel efficiency.'
  },
  'A330': {
    name: 'Airbus A330',
    manufacturer: 'Airbus',
    imageId: 'airbus-a330.jpg',
    capacity: '250-440 passengers',
    range: '7,400 nm',
    cruiseSpeed: 'Mach 0.82',
    firstFlight: '1992',
    description: 'A wide-body twin-engine jet ideal for medium to long-haul routes, known for its efficiency and reliability.'
  },
  'A350': {
    name: 'Airbus A350 XWB',
    manufacturer: 'Airbus',
    imageId: 'airbus-a350.jpg',
    capacity: '300-410 passengers',
    range: '8,700 nm',
    cruiseSpeed: 'Mach 0.85',
    firstFlight: '2013',
    description: 'Airbus\'s most modern wide-body aircraft, featuring composite materials and advanced aerodynamics.'
  },
  'A380': {
    name: 'Airbus A380',
    manufacturer: 'Airbus',
    imageId: 'airbus-a380.jpg',
    capacity: '555-853 passengers',
    range: '8,000 nm',
    cruiseSpeed: 'Mach 0.85',
    firstFlight: '2005',
    description: 'The world\'s largest passenger airliner, featuring two full-length passenger decks.'
  },
  'E175': {
    name: 'Embraer E175',
    manufacturer: 'Embraer',
    imageId: 'embraer-e175.jpg',
    capacity: '76-88 passengers',
    range: '2,200 nm',
    cruiseSpeed: 'Mach 0.75',
    firstFlight: '2002',
    description: 'A narrow-body regional jet, popular with regional airlines for its efficiency and passenger comfort.'
  },
  'CRJ900': {
    name: 'Bombardier CRJ900',
    manufacturer: 'Bombardier',
    imageId: 'bombardier-crj900.jpg',
    capacity: '76-90 passengers',
    range: '1,550 nm',
    cruiseSpeed: 'Mach 0.75',
    firstFlight: '2001',
    description: 'A regional jet designed for short to medium-haul routes, known for its operational flexibility.'
  }
};

// Function to get aircraft info from a model string
export function getAircraftInfo(aircraftModel: string): AircraftInfo | null {
  if (!aircraftModel) return null;
  
  // Try direct match first
  const directMatch = aircraftInfo[aircraftModel];
  if (directMatch) return directMatch;
  
  // Try to find in the mapping
  const mappedModel = aircraftModelMap[aircraftModel];
  if (mappedModel && aircraftInfo[mappedModel]) {
    return aircraftInfo[mappedModel];
  }
  
  // Try partial matching
  const modelUpper = aircraftModel.toUpperCase();
  for (const [key, value] of Object.entries(aircraftModelMap)) {
    if (modelUpper.includes(key.toUpperCase()) || key.toUpperCase().includes(modelUpper)) {
      const info = aircraftInfo[value];
      if (info) return info;
    }
  }
  
  // Default fallback
  return null;
}

// Function to get aircraft image URL from Google Cloud Storage
export function getAircraftImageUrl(imageId: string): string {
  // Prefer explicit base URL, fallback to bucket name
  const baseUrl = import.meta.env.VITE_AIRCRAFT_IMAGES_BASE_URL;
  const bucketName = import.meta.env.VITE_AIRCRAFT_IMAGES_BUCKET;
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/${imageId}`;
  }
  if (bucketName) {
    return `https://storage.googleapis.com/${bucketName}/${imageId}`;
  }
  // Final fallback - relative path so app still shows an image in dev
  return `/aircraft/${imageId}`;
}