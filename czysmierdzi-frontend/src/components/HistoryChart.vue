<template>
  <div class="my-4">
    <LineChart :data="chartData" :options="chartOptions" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios, { AxiosResponse } from "axios";
import { io, Socket } from "socket.io-client";
import { Line as LineChart } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ChartData,
  ChartOptions,
} from "chart.js";

// Register necessary Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

// Define the structure of a history item from the API
interface HistoryItem {
  timestamp: string; // ISO date string or any parsable date string
  status: "yes" | "no" | "uncertain";
}

// Define the structure of the history response
type HistoryResponse = HistoryItem[];

// Define the chart data with proper typing
const chartData = ref<ChartData<"line">>({
  labels: [],
  datasets: [
    {
      label: "Smell Status",
      data: [],
      fill: false,
      borderColor: "rgba(75, 192, 192, 1)",
      tension: 0.1,
      pointBackgroundColor: "rgba(75, 192, 192, 1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(75, 192, 192, 1)",
    },
  ],
});

// Define the chart options with proper typing
const chartOptions = ref<ChartOptions<"line">>({
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "History of Smell Submissions",
    },
  },
  scales: {
    y: {
      min: -1,
      max: 1,
      ticks: {
        callback: function (value: number | string) {
          if (value === 1) return "Yes";
          if (value === -1) return "No";
          return "Uncertain";
        },
      },
    },
    x: {
      type: "category",
      ticks: {
        autoSkip: true,
        maxTicksLimit: 10,
      },
    },
  },
});

// Fetch the history data from the API
const fetchHistoryData = async (): Promise<void> => {
  try {
    const res: AxiosResponse<HistoryResponse> = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/history`
    );

    updateChartData(res.data);
  } catch (err) {
    console.error("Error fetching history data:", err);
  }
};

// Function to update chart data
const updateChartData = (history: HistoryItem[]) => {
  const labels = history.map((item) =>
    new Date(item.timestamp).toLocaleString()
  );
  const data = history.map((item) => {
    switch (item.status) {
      case "yes":
        return 1;
      case "no":
        return -1;
      case "uncertain":
        return 0;
      default:
        return 0;
    }
  });

  // Update chartData.value using new arrays to trigger reactivity
  chartData.value = {
    labels,
    datasets: [
      {
        label: "Smell Status",
        data,
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1,
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(75, 192, 192, 1)",
      },
    ],
  };
};

// Initialize Socket.IO client
const socket: Socket = io(
  import.meta.env.VITE_API_BASE_URL.replace("/api", "")
);

// Function to handle new submissions received via Socket.IO
const handleNewSubmission = (submission: HistoryItem): void => {
  const newLabel = new Date(submission.timestamp).toLocaleString();
  const newData =
    submission.status === "yes" ? 1 : submission.status === "no" ? -1 : 0;

  // Create new arrays for reactivity to trigger in Vue
  chartData.value = {
    labels: [...chartData.value.labels!, newLabel],
    datasets: [
      {
        ...chartData.value.datasets[0],
        data: [...chartData.value.datasets[0].data!, newData],
      },
    ],
  };
};

// Lifecycle hooks to manage data fetching and real-time updates
onMounted(() => {
  fetchHistoryData();

  // Listen for 'newSubmission' events from the server
  socket.on("newSubmission", handleNewSubmission);
});

onUnmounted(() => {
  // Clean up the socket connection when the component is unmounted
  socket.off("newSubmission", handleNewSubmission);
  socket.disconnect();
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
