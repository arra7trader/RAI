export function coordinatesFromGoogleMaps(value: string) {
  if (!value) return { latitude: null, longitude: null };
  try {
    const url = new URL(value);
    const text = `${url.pathname}${url.search}${url.hash}`;
    const match = text.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/) ?? text.match(/@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/) ?? text.match(/[?&](?:q|query)=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/);
    if (!match) return { latitude: null, longitude: null };
    const latitude = Number(match[1]); const longitude = Number(match[2]);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return { latitude: null, longitude: null };
    return { latitude, longitude };
  } catch { return { latitude: null, longitude: null }; }
}
