<!-- src/components/SubmitButtons.vue -->
<template>
  <div class="flex justify-center space-x-4 my-4">
    <button @click="submit('yes')" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
      Yes
    </button>
    <button @click="submit('no')" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
      No
    </button>
  </div>
</template>

<script>
export default {
  emits: ['submit'],
  methods: {
    submit(status) {
      this.$emit('submit', status)
    },
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
