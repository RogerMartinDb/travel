export {
  getWalkingDistances,
  addWalkingMap
}

import { Loader } from "@googlemaps/js-api-loader"

const loader = new Loader({
  apiKey: "AIzaSyAXu6sMFeiYSQDPXaR5IvOcgOmIjcO0Wq0",
  version: "weekly"
});

const google_script = loader.load()

function LatLng(location) {
  return { lat: location.latitude, lng: location.longitude }
}

function getWalkingDistances(fromLocation, toLocations) {
  return new Promise(async (resolve, reject) => {
    const origin = LatLng(fromLocation)
    const destinations = toLocations.map(location => LatLng(location))

    await google_script.then()
    var service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: destinations,
        travelMode: 'WALKING'
      },
      (response, status) => {
        if (status === "OK")
          resolve(response)
        else
          reject(status)
      }
    );
  })
}

async function addWalkingMap(mapDiv, from, to) {

  await google_script.then()

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const map = new google.maps.Map(mapDiv, {
    zoom: 15,
    minZoom: 15,
    center: LatLng(from),
  });

  directionsRenderer.setMap(map);

  await directionsService
    .route({
      origin: LatLng(from),
      destination: LatLng(to),
      travelMode: google.maps.TravelMode.WALKING,
    })
    .then((response) => {
      directionsRenderer.setDirections(response);
    })
    .catch((e) => console.log("Directions request failed due to " + e.status));
}
