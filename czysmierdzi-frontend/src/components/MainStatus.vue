<!-- src/components/MainStatus.vue -->
<template>
  <div class="text-center my-4">
    <h1 class="text-4xl font-bold">Current Status:</h1>
    <p class="text-2xl mt-2" :class="statusClass">{{ statusText }}</p>
  </div>
</template>

<script>
export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  computed: {
    statusText() {
      return this.status.charAt(0).toUpperCase() + this.status.slice(1);
    },
    statusClass() {
      switch (this.status) {
        case 'yes':
          return 'text-green-500';
        case 'no':
          return 'text-red-500';
        case 'uncertain':
          return 'text-yellow-500';
        default:
          return 'text-gray-500';
      }
    },
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
