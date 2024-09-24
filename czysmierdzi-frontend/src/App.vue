<!-- src/App.vue -->
<template>
  <div class="container mx-auto p-4">
    <MainStatus :status="latestStatus" />
    <!-- <HistoryChart :history="history" /> -->
    <AverageChart :averages="averages" />
    <SubmitButtons @submit="handleSubmit" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios, { AxiosResponse } from "axios";
import { io, Socket } from "socket.io-client";
import MainStatus from "./components/MainStatus.vue";
// import HistoryChart from "./components/HistoryChart.vue";
import AverageChart from "./components/AverageChart.vue"; // Import the new AverageChart component
import SubmitButtons from "./components/SubmitButtons.vue";

// Define the structure of a history item
interface HistoryItem {
  timestamp: string; // ISO date string or any parsable date string
  status: number; // Numerical status between 0 and 10
}

// Define the structure of the latest status response
interface LatestStatusResponse {
  status: number; // Numerical status between 0 and 10
}

// Define the structure of the history response
type HistoryResponse = HistoryItem[];

// Define the structure of an average data item
interface AverageItem {
  windowStart: string; // ISO date string
  averageStatus: number; // Average status value
}

// Define the structure of a new submission event
interface NewSubmissionEvent {
  status: number; // Numerical status between 0 and 10
  timestamp: string;
}

// Define the API base URL from environment variables
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

// Reactive references
const latestStatus = ref<number>(0);
const history = ref<HistoryItem[]>([]);
const averages = ref<AverageItem[]>([]); // New reactive reference for average data

// Initialize Socket.IO client
const socket: Socket = io(API_BASE_URL.replace("/api", ""));

// Function to fetch the latest status from the API
const fetchLatestStatus = async (): Promise<void> => {
  try {
    const res: AxiosResponse<LatestStatusResponse> = await axios.get(
      `${API_BASE_URL}/latest`
    );
    latestStatus.value = res.data.status !== undefined ? res.data.status : 0;
  } catch (err) {
    console.error("Error fetching latest status:", err);
    latestStatus.value = 0;
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

// Function to fetch the average data from the API
const fetchAverages = async (): Promise<void> => {
  try {
    const res: AxiosResponse<AverageItem[]> = await axios.get(
      `${API_BASE_URL}/average`
    );
    averages.value = res.data;
  } catch (err) {
    console.error("Error fetching average data:", err);
    averages.value = [];
  }
};

// Function to handle submission from SubmitButtons component
const handleSubmit = async (status: number): Promise<void> => {
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
  // Optionally, update averages if the new submission falls within existing windows
  // For simplicity, re-fetch averages
  fetchAverages();
};

// Lifecycle hooks
onMounted(() => {
  fetchLatestStatus();
  fetchHistory();
  fetchAverages();

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
