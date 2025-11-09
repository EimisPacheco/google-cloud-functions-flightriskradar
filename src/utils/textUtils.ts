// Utility functions for text formatting

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export const capitalizeFirstLetter = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getRiskColor = (level: string | undefined | null): string => {
  if (!level) return 'text-slate-600';
  
  const normalizedLevel = level.toLowerCase().replace(/_/g, ' ');
  
  switch (normalizedLevel) {
    case 'low':
    case 'very low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
    default:
      return 'text-slate-600';
  }
};

export const formatRiskLevel = (level: string | undefined | null): string => {
  // Handle undefined/null values
  if (!level) return 'Unknown';
  
  // Remove underscores and capitalize properly
  return level.replace(/_/g, ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}; 

/**
 * Calculate the highest weather risk level from all airports in a flight
 * Priority: High > Medium > Low
 */
export const calculateHighestWeatherRisk = (flight: any): string => {
  const riskLevels: string[] = [];
  
  // Add origin weather risk
  if (flight.originAnalysis?.weather_risk?.level) {
    riskLevels.push(flight.originAnalysis.weather_risk.level.toLowerCase());
  }
  
  // Add destination weather risk
  if (flight.destinationAnalysis?.weather_risk?.level) {
    riskLevels.push(flight.destinationAnalysis.weather_risk.level.toLowerCase());
  }
  
  // Add layover weather risks
  if (flight.connections && flight.connections.length > 0) {
    flight.connections.forEach((connection: any) => {
      if (connection.layoverInfo?.weather_risk?.level) {
        riskLevels.push(connection.layoverInfo.weather_risk.level.toLowerCase());
      }
    });
  }
  
  // Add connection analysis weather risks
  if (flight.connection_analysis?.connection_details) {
    flight.connection_analysis.connection_details.forEach((connection: any) => {
      if (connection.weather_risk?.level) {
        riskLevels.push(connection.weather_risk.level.toLowerCase());
      }
    });
  }
  
  // If no specific weather risks found, fall back to the general weather risk
  if (riskLevels.length === 0 && flight.riskFactors?.weatherRisk) {
    riskLevels.push(flight.riskFactors.weatherRisk.toLowerCase());
  }
  
  // Determine highest risk level
  if (riskLevels.includes('high')) return 'high';
  if (riskLevels.includes('medium')) return 'medium';
  if (riskLevels.includes('low')) return 'low';
  
  return 'medium'; // Default fallback
};

/**
 * Calculate the highest airport complexity level from all airports in a flight
 * Priority: High > Medium > Low
 */
export const calculateHighestAirportComplexity = (flight: any): string => {
  const complexityLevels: string[] = [];
  
  // Add origin airport complexity
  if (flight.originAnalysis?.airport_complexity?.complexity) {
    complexityLevels.push(flight.originAnalysis.airport_complexity.complexity.toLowerCase());
  }
  
  // Add destination airport complexity
  if (flight.destinationAnalysis?.airport_complexity?.complexity) {
    complexityLevels.push(flight.destinationAnalysis.airport_complexity.complexity.toLowerCase());
  }
  
  // Add layover airport complexities
  if (flight.connections && flight.connections.length > 0) {
    flight.connections.forEach((connection: any) => {
      if (connection.layoverInfo?.airport_complexity?.complexity) {
        complexityLevels.push(connection.layoverInfo.airport_complexity.complexity.toLowerCase());
      }
    });
  }
  
  // Add connection analysis airport complexities
  if (flight.connection_analysis?.connection_details) {
    flight.connection_analysis.connection_details.forEach((connection: any) => {
      if (connection.airport_complexity?.complexity) {
        complexityLevels.push(connection.airport_complexity.complexity.toLowerCase());
      }
    });
  }
  
  // If no specific complexity levels found, fall back to the general airport complexity
  if (complexityLevels.length === 0 && flight.riskFactors?.airportComplexity) {
    complexityLevels.push(flight.riskFactors.airportComplexity.toLowerCase());
  }
  
  // Determine highest complexity level
  if (complexityLevels.includes('high')) return 'high';
  if (complexityLevels.includes('medium')) return 'medium';
  if (complexityLevels.includes('low')) return 'low';
  
  return 'medium'; // Default fallback
}; 