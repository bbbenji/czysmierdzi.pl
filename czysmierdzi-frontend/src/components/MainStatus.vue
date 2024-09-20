<!-- src/components/MainStatus.vue -->
<template>
  <div class="text-center my-4">
    <h1 class="text-4xl font-bold">Current Status:</h1>
    <p class="text-2xl mt-2" :class="statusClass">{{ statusText }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

// Define the accepted status types
type StatusType = "yes" | "no" | "uncertain" | string;

// Define props with TypeScript
const props = defineProps<{
  status: StatusType;
}>();

// Computed property for formatted status text
const statusText = computed(() => {
  if (props.status.length === 0) return "";
  return props.status.charAt(0).toUpperCase() + props.status.slice(1);
});

// Computed property for dynamic status class
const statusClass = computed(() => {
  switch (props.status) {
    case "yes":
      return "text-green-500";
    case "no":
      return "text-red-500";
    case "uncertain":
      return "text-yellow-500";
    default:
      return "text-gray-500";
  }
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
