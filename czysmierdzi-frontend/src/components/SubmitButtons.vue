<template>
  <!-- Button Group Container -->
  <div class="flex justify-center my-4">
    <div class="flex">
      <!-- Iterate over numbers 0 to 10 -->
      <Button
        v-for="(num, index) in 11"
        :key="index"
        @click="submit(index)"
        :class="[
          'text-white font-bold py-2 px-4 transition-colors duration-300',
          colorClasses[index],
          selected === index ? '' : '',
          index === 0
            ? 'rounded-l rounded-r-none'
            : index === colorClasses.length - 1
            ? 'rounded-r rounded-l-none'
            : 'rounded-none',
        ]"
      >
        {{ index }}
      </Button>
    </div>
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

// Define an array mapping numbers 0-10 to Tailwind background color classes
const colorClasses = [
  "bg-[#84cc16] hover:bg-[#739a14]", // Green
  "bg-[#9ccc16] hover:bg-[#83a315]", // Light Green
  "bg-[#b3cc16] hover:bg-[#95a315]", // Yellow-Green
  "bg-[#cbcc15] hover:bg-[#a0a214]", // Yellowish Green
  "bg-[#e2cc15] hover:bg-[#bdb214]", // Lime
  "bg-[#facc15] hover:bg-[#d4a314]", // Yellow
  "bg-[#faa016] hover:bg-[#d18d14]", // Amber
  "bg-[#f97316] hover:bg-[#d15b14]", // Orange
  "bg-[#ef591b] hover:bg-[#c34919]", // Deep Orange
  "bg-[#e63f20] hover:bg-[#c3331b]", // Red-Orange
  "bg-[#dc2626] hover:bg-[#b41c1c]", // Red
];
</script>

<style scoped>
/* Optional: Add any additional styles if necessary */
</style>
