export default locateStopsNear

import circle from './surface-of-earth.js'
import { getWalkingDistances } from "./GoogleMaps"

async function locateStopsNear(location, radius) {
  if (location.latitude == null) {
    return { status: "location not available" }
  }

  const stops = await parseStops();

  const myCircle = circle(location, radius)
  const localStops = await findStopsInside(myCircle, stops)

  await decorateWithWalkingDistances(location, localStops)

  return localStops
}

async function decorateWithWalkingDistances(from, stops) {
  const walkingDistances = await getWalkingDistances(from, stops.map(stop => stop.location))
  stops.forEach((stop, index) => stop.walking = walkingDistances.rows[0].elements[index])
}

function findStopsInside(myCircle, stops) {
  return stops.filter(stop => myCircle.contains(stop.location))
}

function parseStops() {
  let stops = []

  return fetch('data/stops.txt')
    .then(response => response.text())
    .then(stopsData => {
      let lines = stopsData.split('\r\n')

      for (var i = 1; i < lines.length; ++i) {
        const fields = lines[i].split('"')

        if (fields.length < 8)
          continue;

        stops.push({
          id: fields[1],
          name: fields[3],
          location: {
            latitude: parseFloat(fields[5]),
            longitude: parseFloat(fields[7])
          },
          stopNumber: stopNumberFromName(fields[3])
        })
      }

      return stops
    })
}

function stopNumberFromName(name) {
  const pattern = /.*stop (No.? ?)?(\d+)/i

  if (!name.match(pattern))
    return NaN;

  return parseInt(name.replace(pattern, '$2'))
}
