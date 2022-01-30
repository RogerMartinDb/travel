<script setup>
import { computed, reactive, ref } from 'vue';
import useAsyncComputed from './use-async-computed';
import locateStopsNear from '../lib/LocalStopDiscovery'
import { findBestServcies, destinationNames } from '../lib/ServicesDiscovery'
import trackLocation from './Location';
import Destination from './Destination.vue';
import Stop from './Stop.vue';

const limitKm = 0.6
const location = trackLocation()
const [localStops] = useAsyncComputed(_ => locateStopsNear(location.value, limitKm))
const [services] = useAsyncComputed(_ => findBestServcies(localStops.value))
const [destinations] = useAsyncComputed(() => destinationNames(services.value, location.value))
const selectedDestinations = ref(new Set())
function toggleDestination(destinationName, on) {
  if (on) {
    selectedDestinations.value.add(destinationName)
  } else {
    selectedDestinations.value.delete(destinationName)
  }
}

const haveLocation = computed(() => location.value?.longitude)
const haveDestinations = computed(() => destinations.value?.length)

const latLongString = ref("")
function useLatLongString() {
  const [latitude, longitude] = latLongString.value.split(',').map(a => Number.parseFloat(a))

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    location.value = { latitude, longitude }
  }
}
function isInDirection(destination, ns, ew) {
  const nne = 45 / 2
  const [nee, ese, ses, ssw, sww, wnw, nwn]
    = [nne + 45, nne + 2 * 45, nne + 3 * 45, nne + 4 * 45, nne + 5 * 45, nne + 6 * 45, nne + 7 * 45]
  const [n, ne, e, se, s, sw, w, nw]
    = [['north', ''], ['north', 'east'], ['', 'east'], ['south', 'east'], ['south', ''], ['south', 'west'], ['', 'west'], ['north', 'west']]

  const bearing = destination.bearing
  let direction = null

  if (bearing > nwn)
    direction = n
  else if (bearing > wnw)
    direction = nw
  else if (bearing > sww)
    direction = w
  else if (bearing > ssw)
    direction = sw
  else if (bearing > ses)
    direction = s
  else if (bearing > ese)
    direction = se
  else if (bearing > nee)
    direction = e
  else if (bearing > nne)
    direction = ne
  else direction = n

  return (ns == direction[0] && ew == direction[1])
}
</script>

<template>
  <div class="departureZone">
    <div v-if="!haveLocation">waiting for location...</div>
    <div v-if="haveLocation && !haveDestinations">looking for services...</div>
    <h1 v-if="haveDestinations">What direction are you heading?</h1>
    <template v-if="false">
      <input v-model="latLongString" />
      <input type="button" value="move to" @click="useLatLongString" />
    </template>
    <table id="destinations">
      <tr v-for="ns in ['north', '', 'south']">
        <td v-for="ew in ['west', '', 'east']">
          <template v-for="destination in destinations">
            <Destination
              v-if="isInDirection(destination, ns, ew)"
              :destinationName="destination.name"
              @toggleDestination="toggleDestination"
            ></Destination>
          </template>
        </td>
      </tr>
    </table>
    <div id="stops">
      <template v-for="service in services">
        <Stop
          :stopInfo="service.stop"
          :departures="service.departures"
          :destinationsToShow="selectedDestinations"
          :myLocation="location"
        ></Stop>
      </template>
    </div>
  </div>
</template>

<style>
.departureZone {
  color: antiquewhite;
}
</style>
