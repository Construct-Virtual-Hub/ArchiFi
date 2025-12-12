// lib/geo/nominatim.ts

// Types
export type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    postcode?: string;
    city?: string;
    town?: string;
    county?: string;
    country?: string;
  };
};

export type GeocodingResult = {
  lat: number;
  lng: number;
  displayName: string;
  postcode?: string;
  city?: string;
};

export type ReverseGeocodingResult = {
  displayName: string;
  postcode?: string;
  city?: string;
  town?: string;
  county?: string;
  country?: string;
};

// Constants
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "ArchiFi/1.0 (architect-discovery-platform)";

// Rate limiter (1 req/sec)
let lastRequestTime = 0;
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
}

// In-memory cache for geocoding results
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
type CacheEntry = {
  result: GeocodingResult | null;
  timestamp: number;
};
const geocodeCache = new Map<string, CacheEntry>();

/**
 * Geocode a UK location string (town or postcode) to coordinates
 * @param query - UK town name or postcode (e.g., "Manchester" or "SW1A 1AA")
 * @returns GeocodingResult with lat/lng and display name, or null if not found
 */
export async function geocodeLocation(
  query: string
): Promise<GeocodingResult | null> {
  if (!query || !query.trim()) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();
  
  // Check cache
  const cached = geocodeCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: "json",
      countrycodes: "gb", // Limit to UK
      limit: "1",
      addressdetails: "1",
    });

    const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      console.error(`Nominatim geocoding failed: ${response.status} ${response.statusText}`);
      // Cache null result to avoid repeated failed requests
      geocodeCache.set(normalizedQuery, {
        result: null,
        timestamp: Date.now(),
      });
      return null;
    }

    const data: NominatimResult[] = await response.json();

    if (!data || data.length === 0) {
      // Cache null result
      geocodeCache.set(normalizedQuery, {
        result: null,
        timestamp: Date.now(),
      });
      return null;
    }

    const result: GeocodingResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
      postcode: data[0].address?.postcode,
      city: data[0].address?.city || data[0].address?.town,
    };

    // Cache successful result
    geocodeCache.set(normalizedQuery, {
      result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error: any) {
    console.error("Geocoding error:", error?.message || error);
    // Cache null result on error
    geocodeCache.set(normalizedQuery, {
      result: null,
      timestamp: Date.now(),
    });
    return null;
  }
}

/**
 * Reverse geocode coordinates to an address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns ReverseGeocodingResult with address details, or null if not found
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: "json",
      countrycodes: "gb",
      addressdetails: "1",
    });

    const url = `${NOMINATIM_BASE}/reverse?${params.toString()}`;
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      console.error(`Nominatim reverse geocoding failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: NominatimResult = await response.json();

    if (!data || !data.address) {
      return null;
    }

    return {
      displayName: data.display_name,
      postcode: data.address.postcode,
      city: data.address.city || data.address.town,
      town: data.address.town,
      county: data.address.county,
      country: data.address.country,
    };
  } catch (error: any) {
    console.error("Reverse geocoding error:", error?.message || error);
    return null;
  }
}

/**
 * Calculate distance between two points in kilometers using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Extract latitude from an item that may have lat/lng or latitude/longitude fields
 */
function extractLat(item: {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
}): number | null {
  if (typeof item.lat === "number") return item.lat;
  if (typeof item.latitude === "number") return item.latitude;
  return null;
}

/**
 * Extract longitude from an item that may have lat/lng or latitude/longitude fields
 */
function extractLng(item: {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
}): number | null {
  if (typeof item.lng === "number") return item.lng;
  if (typeof item.longitude === "number") return item.longitude;
  return null;
}

/**
 * Filter results by radius from center point
 * @param items - Array of items with lat/lng or latitude/longitude fields
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Filtered array of items within the radius
 */
export function filterByRadius<T extends {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
}>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): T[] {
  return items.filter((item) => {
    const lat = extractLat(item);
    const lng = extractLng(item);

    if (lat === null || lng === null) {
      return false; // Exclude items without coordinates
    }

    const distance = calculateDistanceKm(centerLat, centerLng, lat, lng);
    return distance <= radiusKm;
  });
}

