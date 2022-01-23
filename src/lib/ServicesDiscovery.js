export { findBestServcies, destinationNames }

const destinations = {}

function destinationNames(stops) {
   const names = new Set()

  for (const stop in stops) {
    stops[stop].departures.forEach(departure => names.add(departure.destination))
  }

  return Array.from(names).sort()
}

function findBestServcies(localStops) {
  if (!localStops || !localStops.forEach) return

  return Promise.allSettled(
    localStops.map(stop => getDeparturesFor(stop).then(processStopDepartures))
  )
  .then(_ => closestStops())
}

function closestStops() {
  const stopsToShow = {}

  Object.values(destinations).forEach(destination => {
    for (const service in destination) {
      const bestStopDepartures =
        Object.values(destination[service])
          .sort((a, b) => a[0].stop.walking.distance.value - b[0].stop.walking.distance.value)
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

  clearStop(stop)

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

function registerDeparture(departure) {
  destinations[departure.destination] ||= {}
  destinations[departure.destination][departure.service] ||= {}
  destinations[departure.destination][departure.service][departure.stop.stopNumber] ||= []
  destinations[departure.destination][departure.service][departure.stop.stopNumber].push(departure)
}

function clearStop(stop) {
  Object.values(destinations).forEach(destination =>
    Object.values(destination).forEach(service =>
      delete service[stop.stopNumber]
    ))
}

class DueStringParser{
  constructor(dueString, now = new Date()){
    now.setSeconds(0);

    dueString = dueString.trim()

    if (dueString === "Due")
    {
        this.minutes = 0;
        this.dueRelative = "Due";
        this.dueAbsolute = this.timeString(now);
        return;
    }

    let match = dueString.match(/^(\d\d):(\d\d)$/);

    if(match){
      let hour = parseInt(match[1], 10);
      let minute = parseInt(match[2], 10);

      let dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

      if (now.getHours() - hour > 12)
        dueTime.setDate(dueTime.getDate() + 1);  // tomorrow

      let minutes = Math.trunc((dueTime - now)/1000/60);
      if (minutes < 0) minutes = 0;

      this.minutes = minutes;
      this.dueAbsolute = dueString;
      this.dueRelative = minutes === 0 ? "Due" : `${minutes} min`;

      return;
    }

    match = dueString.match(/(\d+) min/);

    if (match)
    {
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

  timeString(date){
    return ("0" + date.getHours()).slice(-2) + ":" +
            ("0" + date.getMinutes()).slice(-2);
  }

}