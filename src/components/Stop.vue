<script setup>
import { toRefs, computed } from 'vue'
import WalkingMap from './WalkingMap.vue';

const props = defineProps({ stopInfo: Object, departures: Array, destinationsToShow: Set, myLocation: Object })
const { stopInfo, departures, destinationsToShow, myLocation } = toRefs(props)

const departuresToShow = computed(() => {
  return departures.value
    .filter(departure => destinationsToShow.value.has(departure.destination))
    .sort((a, b) => a.dueMinutes - b.dueMinutes)
})
</script>

<template>
  <div v-show="departuresToShow.length > 0">
    <div class="panel panel-info well">
      <div class="panel-heading">
        <div class="panel-title">{{ stopInfo.name }}</div>
      </div>
      <div class="panel-body">
        <ul class="list-group">
          <li class="list-group-item" v-for="departure in departuresToShow">
            <b>{{ departure.service }}</b>
            {{ departure.destination }}: {{ departure.dueAbsolute }} ({{ departure.dueString }})
          </li>
        </ul>
        <WalkingMap :from="myLocation" :to="stopInfo.location"></WalkingMap>
      </div>
    </div>
  </div>
</template>

<style>

.panel-info > .panel-heading {
  color: #08632b;
  background-color: hsl(0, 0%, 90%);
  border-color: #050505;
  border-radius: 22px;
}

.panel-title {
    margin-top: 10;
    margin-bottom: 0;
    font-size: 20px;
}

.panel {
    border-radius: 22px;
}

.well {
    min-height: 20px;
    padding: 19px;
    margin: 20px;
    background-color: #f5f5f5;
    border: 1px solid #e3e3e3;
    border-radius: 4px;
    -webkit-box-shadow: inset 0 1px 1px rgb(0 0 0 / 5%);
    box-shadow: inset 0 1px 1px rgb(0 0 0 / 5%);
}

.list-group {
    display: flex;
    flex-direction: column;
    padding-left: 0;
    margin-bottom: 0;
    border-radius: 0.25rem;
}

.list-group-item+.list-group-item {
    border-top-width: 0;
}

.list-group-item {
    position: relative;
    display: block;
    padding: 0.5rem 1rem;
    color: #212529;
    text-decoration: none;
    background-color: #fff;
    border: 1px solid rgba(0,0,0,.125);
}

</style>