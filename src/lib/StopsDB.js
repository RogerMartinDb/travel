export { allStops, canonicalName }

import { xml2js } from "xml-js"

async function allStops() {
  return await Promise
                .all([parseBusStops(), parseTrainStations()])
                .then(([busStops, trainStation]) => busStops.concat(trainStation))
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
            stopNumber: stn.StationCode._text,
            canonicalName: stn.StationDesc._text
          })))
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
          stopNumber: stopNumberFromName(fields[3]),
          canonicalName: canonicalName(fields[3])
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

function canonicalName(name) {
  const stopNumber = /, *stop .*/i

  return name
          .replace(stopNumber, '')
          .replace(/Avenue/i, 'Ave')
          .replace(/Road/i, 'Rd')
          .replace(/Drive/i, 'Drv')
          .replace(/Lane/i, 'Ln')
          .replace(/Park/i, 'Pk')
          .replace(/Place/i, 'Pl')
          .replace(/Court/i, 'Ct')
}