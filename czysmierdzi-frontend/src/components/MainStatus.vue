<!-- src/components/MainStatus.vue -->
<template>
  <div class="text-center my-4">
    <h1 class="text-4xl font-bold">Current Status:</h1>
    <p class="text-2xl mt-2" :class="statusClass">{{ statusText }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

// Define the accepted status type as a number between 0 and 10
type StatusType = number;

// Define props with TypeScript
const props = defineProps<{
  status: StatusType;
}>();

// Computed property for formatted status text
const statusText = computed(() => {
  return props.status !== null && props.status !== undefined
    ? props.status.toString()
    : "N/A";
});

// Computed property for dynamic status class based on the numerical value
const statusClass = computed(() => {
  if (props.status === null || props.status === undefined) {
    return "text-gray-500";
  } else if (props.status >= 8 && props.status <= 10) {
    return "text-red-500";
  } else if (props.status >= 4 && props.status < 8) {
    return "text-yellow-500";
  } else if (props.status >= 0 && props.status < 4) {
    return "text-green-500";
  } else {
    return "text-gray-500";
  }
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
