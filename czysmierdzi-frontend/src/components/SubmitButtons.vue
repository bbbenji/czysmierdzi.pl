<template>
  <div class="flex justify-center flex-wrap gap-2 my-4">
    <Button v-for="num in 11" :key="num - 1" @click="submit(num - 1)">
      {{ num - 1 }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { Button } from "@/components/ui/button";

// Define the emit event with TypeScript to accept numbers from 0 to 10
const emit = defineEmits<{
  (e: "submit", status: number): void;
}>();

// Optional: Track the selected number for UI feedback
const selected = ref<number | null>(null);

// Method to emit the event
function submit(status: number) {
  selected.value = status;
  emit("submit", status);
}
</script>

<style scoped></style>
