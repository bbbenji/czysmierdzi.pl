<!-- src/App.vue -->
<template>
  <div class="container mx-auto p-4">
    <MainStatus :status="latestStatus" />
    <HistoryChart :history="history" />
    <SubmitButtons @submit="handleSubmit" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { io } from "socket.io-client";
import MainStatus from "./components/MainStatus.vue";
import HistoryChart from "./components/HistoryChart.vue";
import SubmitButtons from "./components/SubmitButtons.vue";

export default {
  components: {
    MainStatus,
    HistoryChart,
    SubmitButtons,
  },
  setup() {
    const latestStatus = ref("uncertain");
    const history = ref([]);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Initialize Socket.IO client
    const socket = io(import.meta.env.VITE_API_BASE_URL.replace("/api", ""));

    const fetchLatestStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/latest`);
        latestStatus.value = res.data.status || "uncertain";
      } catch (err) {
        console.error(err);
        latestStatus.value = "uncertain";
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/history`);
        history.value = res.data;
      } catch (err) {
        console.error(err);
        history.value = [];
      }
    };

    const handleSubmit = async (status) => {
      try {
        await axios.post(`${API_BASE_URL}/submit`, { status });
        // No need to manually fetch data; real-time updates will handle it
      } catch (err) {
        console.error(err);
      }
    };

    // Handle incoming real-time submissions
    const handleNewSubmission = (submission) => {
      latestStatus.value = submission.status;
      // Use Vue's reactivity to update the history array
      history.value = [...history.value, submission];
    };

    onMounted(() => {
      fetchLatestStatus();
      fetchHistory();

      // Listen for 'newSubmission' events
      socket.on("newSubmission", handleNewSubmission);
    });

    onUnmounted(() => {
      // Clean up the socket connection when component is unmounted
      socket.off("newSubmission", handleNewSubmission);
      socket.disconnect();
    });

    return {
      latestStatus,
      history,
      handleSubmit,
    };
  },
};
</script>

<style>
/* Global styles can be added here */
</style>
