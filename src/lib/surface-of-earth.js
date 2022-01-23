export default function circle(location, radius) {
  const R = 6371; // Radius of the earth in km
  const outerBounds = calculateOuterBounds(location, radius);

  function contains(point) {
    if (Math.abs(location.latitude - point.latitude) > outerBounds.deltaLatitude
      || Math.abs(location.longitude - point.longitude) > outerBounds.deltaLongitude) {
      return false
    }

    return distanceTo(point) < radius
  }

  function distanceTo(point) {
    return distance(location, point)
  }

  function distance(a, b) {
    const lat1 = deg2rad(a.latitude)
    const lat2 = deg2rad(b.latitude)
    const deltaLatitude = deg2rad(a.latitude - b.latitude);
    const deltaLongitude = deg2rad(a.longitude - b.longitude);
    const x =
      haversine(deltaLatitude) +
      Math.cos(lat1) * Math.cos(lat2) * haversine(deltaLongitude)
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
    return R * c;
  }

  function calculateOuterBounds() {
    const deltaLatitude = radius / R
    const deltaLongitude = 2 * Math.asin(Math.sqrt(haversine(radius / R) / (Math.cos(deg2rad(location.latitude)) ** 2)))

    return {
      deltaLatitude: rad2deg(deltaLatitude),
      deltaLongitude: rad2deg(deltaLongitude)
    };
  }

  function haversine(theta) {
    return Math.sin(theta / 2) ** 2
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180)
  }

  function rad2deg(rad) {
    return rad * (180 / Math.PI)
  }

  return { contains, distanceTo, location }
}
