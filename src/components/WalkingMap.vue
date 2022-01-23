<script setup>
  import { computed, onMounted, ref, toRefs } from 'vue';
  import { addWalkingMap } from '../lib/GoogleMaps';

  const props = defineProps({from: Object, to: Object})
  const {from, to} = toRefs(props)
  const mapDiv = ref(null)

  const showMap = ref(false)
  const toggleText = computed(() => showMap.value ? 'Hide directions' : "Show directions to stop")

  function toggleMap() {
    showMap.value = !showMap.value
  }

  onMounted(() => {
    addWalkingMap(mapDiv.value, from.value, to.value)
  })

</script>
<template>
  <input type="button" class="show-button" :value="toggleText" @click="toggleMap" />
  <div v-show="showMap" ref="mapDiv" class="map"></div>
</template>

<style>
.map {
  height: 400px;
  width: 100%;
}

.show-button {
  margin: 5px;
}
</style>
