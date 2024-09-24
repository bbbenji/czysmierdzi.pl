<!-- src/App.vue -->
<template>
  <div class="container mx-auto p-4">
    <MainStatus :status="latestStatus" />
    <!-- <HistoryChart /> -->
    <PercentageChart />
    <SubmitButtons @submit="handleSubmit" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import MainStatus from "./components/MainStatus.vue";
// import HistoryChart from "./components/HistoryChart.vue";
import PercentageChart from "./components/PercentageChart.vue";
import SubmitButtons from "./components/SubmitButtons.vue";

// Define the possible status types
type StatusType = "yes" | "no" | "uncertain";

// Reactive reference for the latest status
const latestStatus = ref<StatusType>("uncertain");

// Initialize Socket.IO client with enhanced configurations
const socket: Socket = io(
  import.meta.env.VITE_API_BASE_URL.replace("/api", ""),
  {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    timeout: 10000,
  }
);

// Function to handle submission from SubmitButtons component
const handleSubmit = async (status: StatusType): Promise<void> => {
  try {
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/submit`, { status });
    // Real-time updates via Socket.IO will handle updating latestStatus
  } catch (error) {
    console.error("Error submitting status:", error);
    // Optionally, notify the user of the error
  }
};

// Function to handle new submissions received via Socket.IO
const handleNewSubmission = (submission: {
  status: StatusType;
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
