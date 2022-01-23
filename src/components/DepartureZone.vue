<script setup>
import { computed, reactive, ref } from 'vue';
import useAsyncComputed from './use-async-computed';
import locateStopsNear from '../lib/LocalStopDiscovery'
import { findBestServcies, destinationNames } from '../lib/ServicesDiscovery'
import trackLocation from './Location';
import Destination from './Destination.vue';
import Stop from './Stop.vue';

const limitKm = 0.5
const location = trackLocation()
const [localStops] = useAsyncComputed(_ => locateStopsNear(location.value, limitKm))
const [services] = useAsyncComputed(_ => findBestServcies(localStops.value))
const destinations = computed(() => destinationNames(services.value))
const selectedDestinations = ref(new Set())
function toggleDestination(destinationName, on) {
  if (on) {
    selectedDestinations.value.add(destinationName)
  } else {
    selectedDestinations.value.delete(destinationName)
  }
}

const haveLocation = computed(() => location.value.longitude)
const haveDestinations = computed(() => destinations.value.length)

</script>

<template>
  <div class="departureZone">
    <div v-if="!haveLocation">waiting for location...</div>
    <div v-if="haveLocation && !haveDestinations">looking for services...</div>
    <h1 v-if="haveDestinations">What direction are you heading?</h1>
    <div id="destinations">
      <Destination
        v-for="destination in destinations"
        :destinationName="destination"
        @toggleDestination="toggleDestination"
      ></Destination>
    </div>
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
