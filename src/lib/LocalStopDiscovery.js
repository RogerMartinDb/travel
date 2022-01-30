export default locateStopsNear

import circle from './surface-of-earth.js'
import { getWalkingDistances } from "./GoogleMaps"
import { allStops } from './StopsDB'

async function locateStopsNear(location, radius) {
  if (location.latitude == null) {
    return { status: "location not available" }
  }

  console.log(`finding stops near ${JSON.stringify(location)}`)

  let stops = await allStops()

  const myCircle = circle(location, radius)
  const localStops = await findStopsInside(myCircle, stops)
  await decorateWithDistances(location, localStops, myCircle)

  return localStops
}
async function decorateWithDistances(from, stops, circle) {
  await getWalkingDistances(from, stops.map(stop => stop.location))
    .then(walkingDistances => {
      stops.forEach((stop, index) => stop.distance = walkingDistances.rows[0].elements[index].distance.value)
    })
    .catch(error => {
      console.log(`failed to get walking distances from ${JSON.stringify(from)}: ${error}`)
      stops.forEach((stop) => stop.distance = circle.distanceTo(stop.location))
    })
}

function findStopsInside(myCircle, stops) {
  return stops.filter(stop => myCircle.contains(stop.location))
}
