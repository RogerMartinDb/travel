import { stop } from "vue"
import { allStops, canonicalName } from "./StopsDB"
import circle from "./surface-of-earth"

export { findBestServcies, listDestinations }

let destinations = {}

async function listDestinations(stops, location) {
  const names = new Set()

  for (const stop in stops) {
    stops[stop].departures.forEach(departure => names.add(departure.destination))
  }

  const result = []
  const _allStops = await allStops()
  for (const name of names) {
    result.push(addLocation(_allStops, name, location))
  }

  return result.sort((a, b) => b.location.latitude - a.location.latitude)
}

function addLocation(_allStops, name, location) {
  let destinationLocation = null
  let bearing = null

  const matches = _allStops.filter(stop => stop.canonicalName == canonicalName(name))
  if (matches.length > 0) {
    destinationLocation = matches[0].location
    bearing = calculateBearing(location, destinationLocation)
  }

  return { name, location: destinationLocation, bearing }
}

function calculateBearing(origin, point) {
  if (point.latitude == null || point.longitude == null) {
    return null
  }

  const myCircle = new circle(origin, 1)

  return myCircle.bearing(point)
}

function findBestServcies(localStops) {
  if (!localStops || !localStops.forEach) return

  destinations = {}

  return Promise.allSettled(
    localStops.filter(stop => stop.type != 'train')
      .map(stop => getDeparturesFor(stop)
        .then(processStopDepartures))
      .concat(
        localStops.filter(stop => stop.type == 'train')
          .map(stop => getDeparturesForStation(stop)
            .then(processStationDepartures))
      )
  )
    .then(_ => closestStops())
}

function getDeparturesForStation(stop) {
  console.log(`getDeparturesForStation ${JSON.stringify(stop)}`)
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.responseType = "document"
    xhr.open('GET', `https://transport.rmartin.workers.dev/realtime/realtime.asmx/getStationDataByCodeXML_WithNumMins?StationCode=${stop.stopNumber}&NumMins=60`, true)
    xhr.onload = () => {
      const doc = xhr.responseXML
      resolve({ stop, doc })
    }
    xhr.send()
  })
}

function closestStops() {
  const stopsToShow = {}

  Object.values(destinations).forEach(destination => {
    for (const service in destination) {
      const bestStopDepartures =
        Object.values(destination[service])
          .sort((a, b) => a[0].stop.distance - b[0].stop.distance)
        [0]

      if (bestStopDepartures) {
        const bestStop = bestStopDepartures[0].stop
        const bestStopNumber = bestStop.stopNumber

        stopsToShow[bestStopNumber] ||= {
          stop: bestStop,
          departures: []
        }

        stopsToShow[bestStopNumber].departures.push(...bestStopDepartures)
      }
    }
  })

  return stopsToShow
}

function getDeparturesFor(stop) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.responseType = "document"
    xhr.open('GET', `https://transport.rmartin.workers.dev/DublinBus-Mobile/Real-Time-Info/?RTPISearch=stops&stopnumber=${stop.stopNumber}`, true)
    xhr.onload = () => {
      const doc = xhr.responseXML
      resolve({ stop, doc })
    }
    xhr.send()
  })
}

function processStopDepartures({ stop, doc }) {
  const buses = doc.querySelectorAll("tr");

  for (let i = 1; i < buses.length; ++i) {
    let cells = buses[i].children;

    const dueParser = new DueStringParser(cells[2].textContent.trim())

    registerDeparture({
      stop: stop,
      service: cells[0].textContent.trim(),
      destination: cells[1].textContent.trim(),
      dueString: dueParser.dueRelative,
      dueMinutes: dueParser.minutes,
      dueAbsolute: dueParser.dueAbsolute
    })
  }
}

function processStationDepartures({ stop, doc }) {
  console.log(`processing stn deparures for ${JSON.stringify(stop)}`)
  let trains = doc.getElementsByTagName('objStationData');

  for (let i = 0; i < trains.length; ++i) {
    let train = trains[i];

    const dueParser = new DueStringParser(train.querySelector("Expdepart").textContent)

    registerDeparture({
      stop: stop,
      service: train.querySelector("Traintype").textContent,
      destination: train.querySelector('Destination').textContent,
      dueString: dueParser.dueRelative,
      dueMinutes: dueParser.minutes,
      dueAbsolute: dueParser.dueAbsolute
    })
  }
}

function registerDeparture(departure) {
  destinations[departure.destination] ||= {}
  destinations[departure.destination][departure.service] ||= {}
  destinations[departure.destination][departure.service][departure.stop.stopNumber] ||= []
  destinations[departure.destination][departure.service][departure.stop.stopNumber].push(departure)
}

class DueStringParser {
  constructor(dueString, now = new Date()) {
    now.setSeconds(0);

    dueString = dueString.trim()

    if (dueString === "Due") {
      this.minutes = 0;
      this.dueRelative = "Due";
      this.dueAbsolute = this.timeString(now);
      return;
    }

    let match = dueString.match(/^(\d\d):(\d\d)$/);

    if (match) {
      let hour = parseInt(match[1], 10);
      let minute = parseInt(match[2], 10);

      let dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

      if (now.getHours() - hour > 12)
        dueTime.setDate(dueTime.getDate() + 1);  // tomorrow

      let minutes = Math.trunc((dueTime - now) / 1000 / 60);
      if (minutes < 0) minutes = 0;

      this.minutes = minutes;
      this.dueAbsolute = dueString;
      this.dueRelative = minutes === 0 ? "Due" : `${minutes} min`;

      return;
    }

    match = dueString.match(/(\d+) min/);

    if (match) {
      this.minutes = parseInt(match[1], 10);
      let dueTime = now;
      dueTime.setMinutes(now.getMinutes() + this.minutes);
      this.dueAbsolute = this.timeString(dueTime);
      this.dueRelative = `${this.minutes} min`;

      return;
    }

    this.minutes = 0;
    this.dueRelative = dueString + "!";
    this.dueAbsolute = "";

  }

  timeString(date) {
    return ("0" + date.getHours()).slice(-2) + ":" +
      ("0" + date.getMinutes()).slice(-2);
  }

}