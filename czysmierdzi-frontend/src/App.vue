<!-- src/App.vue -->
<template>
  <div class="container mx-auto p-4">
    <MainStatus :status="latestStatus" />
    <HistoryChart />
    <DatePicker />
    <PercentageChart />
    <SubmitButtons @submit="handleSubmit" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import MainStatus from "./components/MainStatus.vue";
import HistoryChart from "./components/HistoryChart.vue";
import PercentageChart from "./components/PercentageChart.vue";
import DatePicker from "./components/DatePicker.vue";
import SubmitButtons from "./components/SubmitButtons.vue";

// Reactive reference for the latest status
const latestStatus = ref<"yes" | "no" | "uncertain">("uncertain");

// Initialize Socket.IO client
const socket: Socket = io(
  import.meta.env.VITE_API_BASE_URL.replace("/api", "")
);

// Function to handle submission from SubmitButtons component
const handleSubmit = async (status: "yes" | "no"): Promise<void> => {
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/submit`, { status });
    // No need to manually fetch data; real-time updates via Socket.IO will handle it
  } catch (err) {
    console.error("Error submitting status:", err);
  }
};

// Function to handle new submissions received via Socket.IO
const handleNewSubmission = (submission: {
  status: "yes" | "no" | "uncertain";
  timestamp: string;
}): void => {
  latestStatus.value = submission.status;
};

// Lifecycle hooks
onMounted(() => {
  // Listen for 'newSubmission' events from the server
  socket.on("newSubmission", handleNewSubmission);
});

onUnmounted(() => {
  // Clean up the socket connection when the component is unmounted
  socket.off("newSubmission", handleNewSubmission);
  socket.disconnect();
});
</script>

<style>
/* Global styles can be added here */
</style>
