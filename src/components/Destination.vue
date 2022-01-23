<script setup>
  import {toRefs} from 'vue'
  const props = defineProps({destinationName: String})
  const {destinationName} = toRefs(props)

  const emit = defineEmits(['toggleDestination'])

  function toggle(e) {
    emit('toggleDestination', destinationName.value, e.target.checked)
  }
</script>

<template>
  <input :id="destinationName" type="checkbox" class="btn-check" @click="toggle" />
  <label :for="destinationName" class="btn btn-primary">{{ destinationName }}</label>
</template>

<style>

.btn-primary {
    background-color: #26a04a;
}

.btn-check:active+.btn-primary, .btn-check:checked+.btn-primary, .btn-primary.active, .btn-primary:active, .show>.btn-primary.dropdown-toggle {
    background-color: #08632b;
}

.btn {
    display: inline-block;
    line-height: 1.5;
    cursor: pointer;
    border: 1px solid transparent;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    border-radius: 0.25rem;
    margin: 5px;
}

.btn-check {
    position: absolute;
    clip: rect(0,0,0,0);
}

</style>
