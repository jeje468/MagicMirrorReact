export type GeoInfo = {
  latitude: number;
  longitude: number;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
};

function getPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export async function getGeoInfo(): Promise<GeoInfo> {
  const fallback: GeoInfo = {
    latitude: 40.7128,
    longitude: -74.006,
    city: "New York",
    principalSubdivision: "NY",
    countryName: "United States",
    countryCode: "US",
  };

  try {
    const pos = await getPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      if (!res.ok) throw new Error("Reverse geocode failed");
      const data = await res.json();
      return {
        latitude,
        longitude,
        city: data.city || data.locality,
        principalSubdivision: data.principalSubdivision,
        countryName: data.countryName,
        countryCode: data.countryCode,
      };
    } catch {
      return { ...fallback, latitude, longitude };
    }
  } catch {
    return fallback;
  }
}
