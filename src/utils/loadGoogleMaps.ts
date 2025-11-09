// Utility to dynamically load Google Maps with API key from environment variable

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=maps,marker,maps3d&v=beta`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));

    document.head.appendChild(script);
  });
};

// Initialize Google Maps when needed
export const initializeGoogleMaps = async (): Promise<typeof google.maps> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key is not configured');
    throw new Error('Google Maps API key is missing');
  }

  await loadGoogleMapsScript();

  if (!window.google?.maps) {
    throw new Error('Google Maps failed to initialize');
  }

  return window.google.maps;
};