<!-- src/components/SubmitButtons.vue -->
<template>
  <div class="flex justify-center space-x-4 my-4">
    <Button @click="submit('yes')"> Yes </Button>
    <Button variant="secondary" @click="submit('no')">No</Button>
  </div>
</template>

<script lang="ts" setup>
import { Button } from "@/components/ui/button";

// Define the emit event with TypeScript
const emit = defineEmits<{
  (e: "submit", status: "yes" | "no"): void;
}>();

// Method to emit the event
function submit(status: "yes" | "no") {
  emit("submit", status);
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
