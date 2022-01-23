import { ref } from 'vue'

export default function trackLocation() {
  const location = ref({latitude: null, longitude: null, accuracy: null})

  navigator.geolocation.watchPosition(
    position => {
      location.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }
      console.log(location.value)
    })

  return location
}
