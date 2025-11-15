// Lightweight solar position estimation (degrees)
// Azimuth: 0 = North, 90 = East, 180 = South, 270 = West
// Elevation: 0 = horizon, 90 = zenith
export function estimateSunPosition(lat: number, lon: number, date = new Date()): { azimuth: number; elevation: number } {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  // Day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60_000;
  const day = Math.floor(diff / 86_400_000);

  // Fractional hour (local time)
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  // Approximate equation of time and declination
  const B = (2 * Math.PI * (day - 81)) / 364; // in radians
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // minutes
  const decl = toRad(23.45) * Math.sin(((360 * (284 + day)) / 365) * (Math.PI / 180)); // radians

  // Time correction for longitude and EoT (minutes)
  const TC = 4 * lon + EoT; // minutes
  const LST = hours + TC / 60; // local solar time (hours)

  // Hour angle (degrees)
  const H = toRad(15 * (LST - 12));
  const phi = toRad(lat);

  const sinEl = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H);
  const elevation = toDeg(Math.asin(Math.min(1, Math.max(-1, sinEl))));

  const cosAz = (Math.sin(decl) - Math.sin(toRad(elevation)) * Math.sin(phi)) / (Math.cos(toRad(elevation)) * Math.cos(phi));
  let az = toDeg(Math.acos(Math.min(1, Math.max(-1, cosAz))));
  // Resolve azimuth quadrant using hour angle: H < 0 => morning (East), H > 0 => afternoon (West)
  if (H > 0) az = 360 - az;

  // Normalize
  if (isNaN(az)) az = 180; // fallback South
  return { azimuth: (az + 360) % 360, elevation: Math.max(-5, Math.min(90, elevation)) };
}

export function sunToScreenPosition(azimuth: number, elevation: number): { xPercent: number; yPercent: number; intensity: number } {
  // Map azimuth (0..360, 0=N) to x (0..100). Push reflections more to right for midday south in N hemisphere.
  let x = (azimuth / 360) * 100;
  // Elevation to y: high sun -> lower y (towards top). Use 15..70% range.
  let y = 70 - (elevation / 90) * 55; // 70% at 0°, ~15% at 90°
  x = Math.max(8, Math.min(92, x));
  y = Math.max(8, Math.min(85, y));

  // Intensity scales with elevation, clamp a bit
  const intensity = Math.max(0.08, Math.min(0.35, (elevation / 60) * 0.28));
  return { xPercent: x, yPercent: y, intensity };
}
