export default locateStopsNear

import circle from './surface-of-earth.js'
import { xml2js } from "xml-js"
import { getWalkingDistances } from "./GoogleMaps"

async function locateStopsNear(location, radius) {
  if (location.latitude == null) {
    return { status: "location not available" }
  }

  console.log(`finding stops near ${JSON.stringify(location)}`)

  let stops = await Promise
                      .all([parseBusStops(), parseTrainStations()])
                      .then(([busStops, trainStation]) => busStops.concat(trainStation))

  const myCircle = circle(location, radius)
  const localStops = await findStopsInside(myCircle, stops)
  await decorateWithDistances(location, localStops, myCircle)

  return localStops
}

function parseTrainStations() {
  return fetch('data/stations.xml')
          .then(response => response.text())
          .then(xmlString => xml2js(xmlString, {compact: true}))
          .then(stations => stations.ArrayOfObjStation.objStation)
          .then(stations => stations.map(stn => new Object({
            type: 'train',
            name: stn.StationDesc._text,
            location: {
              latitude: Number.parseFloat(stn.StationLatitude._text),
              longitude: Number.parseFloat(stn.StationLongitude._text)
            },
            stopNumber: stn.StationCode._text
          })))
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

function parseBusStops() {
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
