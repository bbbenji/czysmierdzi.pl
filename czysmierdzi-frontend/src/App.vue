<!-- src/App.vue -->
<template>
  <div class="container mx-auto p-4">
    <MainStatus :status="latestStatus" />
    <HistoryChart :history="history" />
    <SubmitButtons @submit="handleSubmit" />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import axios from "axios";
import MainStatus from "./components/MainStatus.vue";
import HistoryChart from "./components/HistoryChart.vue";
import SubmitButtons from "./components/SubmitButtons.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default {
  components: {
    MainStatus,
    HistoryChart,
    SubmitButtons,
  },
  setup() {
    const latestStatus = ref("uncertain");
    const history = ref([]);

    const fetchLatestStatus = async () => {
      try {
        // const res = await axios.get("http://localhost:5000/api/latest");
        const res = await axios.get(`${API_BASE_URL}/latest`);
        latestStatus.value = res.data.status || "uncertain";
      } catch (err) {
        console.error(err);
        latestStatus.value = "uncertain";
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/history");
        history.value = res.data;
      } catch (err) {
        console.error(err);
        history.value = [];
      }
    };

    const handleSubmit = async (status) => {
      try {
        await axios.post("http://localhost:5000/api/submit", { status });
        // Refresh data
        await fetchLatestStatus();
        await fetchHistory();
      } catch (err) {
        console.error(err);
      }
    };

    onMounted(() => {
      fetchLatestStatus();
      fetchHistory();
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
