<!-- src/App.vue -->
<template>
  <div class="container mx-auto p-4">
    <MainStatus :status="latestStatus" />
    <HistoryChart :history="history" />
    <SubmitButtons @submit="handleSubmit" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios, { AxiosResponse } from "axios";
import { io, Socket } from "socket.io-client";
import MainStatus from "./components/MainStatus.vue";
import HistoryChart from "./components/HistoryChart.vue";
import SubmitButtons from "./components/SubmitButtons.vue";

// Define the structure of a history item
interface HistoryItem {
  timestamp: string; // ISO date string or any parsable date string
  status: "yes" | "no" | "uncertain";
}

// Define the structure of the latest status response
interface LatestStatusResponse {
  status: "yes" | "no" | "uncertain";
}

// Define the structure of the history response
type HistoryResponse = HistoryItem[];

// Define the structure of a new submission event
interface NewSubmissionEvent {
  status: "yes" | "no" | "uncertain";
  timestamp: string;
}

// Define the API base URL from environment variables
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

// Reactive references
const latestStatus = ref<"yes" | "no" | "uncertain">("uncertain");
const history = ref<HistoryItem[]>([]);

// Initialize Socket.IO client
const socket: Socket = io(API_BASE_URL.replace("/api", ""));

// Function to fetch the latest status from the API
const fetchLatestStatus = async (): Promise<void> => {
  try {
    const res: AxiosResponse<LatestStatusResponse> = await axios.get(
      `${API_BASE_URL}/latest`
    );
    latestStatus.value = res.data.status || "uncertain";
  } catch (err) {
    console.error("Error fetching latest status:", err);
    latestStatus.value = "uncertain";
  }
};

// Function to fetch the history from the API
const fetchHistory = async (): Promise<void> => {
  try {
    const res: AxiosResponse<HistoryResponse> = await axios.get(
      `${API_BASE_URL}/history`
    );
    history.value = res.data;
  } catch (err) {
    console.error("Error fetching history:", err);
    history.value = [];
  }
};

// Function to handle submission from SubmitButtons component
const handleSubmit = async (status: "yes" | "no"): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/submit`, { status });
    // No need to manually fetch data; real-time updates via Socket.IO will handle it
  } catch (err) {
    console.error("Error submitting status:", err);
  }
};

// Function to handle new submissions received via Socket.IO
const handleNewSubmission = (submission: NewSubmissionEvent): void => {
  latestStatus.value = submission.status;
  history.value = [...history.value, submission];
};

// Lifecycle hooks
onMounted(() => {
  fetchLatestStatus();
  fetchHistory();

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
