<template>
  <div class="my-4">
    <div class="flex justify-end">
      <DatePicker @update:dateRange="handleDateRangeUpdate" />
    </div>
    <LineChart :data="chartData" :options="chartOptions" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
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
  TimeScale,
  ChartData,
  ChartOptions,
} from "chart.js";
import "chartjs-adapter-date-fns";

import DatePicker from "./DatePicker.vue";

// Register necessary Chart.js components, including TimeScale
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale
);

// Define the structure of the percentage item from the API
interface PercentageItem {
  timeBlock: string; // ISO date string or any parsable date string
  yesPercentage: number;
  totalSubmissions: number;
}

// Define the structure of the response from the API
type PercentageResponse = PercentageItem[];

// Define the chart data with proper typing
const chartData = ref<ChartData<"line">>({
  datasets: [
    {
      label: "Yes Percentage",
      data: [], // Will be populated with {x, y} objects
      fill: false,
      borderColor: "rgba(75, 192, 192, 1)",
      tension: 0.4, // Smoothing between points
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
      text: "Percentage of 'Yes' Submissions",
    },
  },
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: {
        callback: function (value: number | string) {
          return `${value}%`;
        },
      },
    },
    x: {
      type: "time",
      time: {
        unit: "hour",
        tooltipFormat: "Pp",
      },
      title: {
        display: true,
        text: "Date",
      },
      ticks: {
        autoSkip: true,
        maxTicksLimit: 24,
      },
    },
  },
});

// Reactive state for selected date range
const selectedDateRange = ref<{
  startDate: string | null;
  endDate: string | null;
}>({
  startDate: null,
  endDate: null,
});

// Fetch the percentage data from the API and update the chart
const fetchPercentageData = async (): Promise<void> => {
  try {
    const params: Record<string, string> = {};
    if (selectedDateRange.value.startDate) {
      params.startDate = selectedDateRange.value.startDate;
    }
    if (selectedDateRange.value.endDate) {
      params.endDate = selectedDateRange.value.endDate;
    }

    const res: AxiosResponse<PercentageResponse> = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/average`,
      { params }
    );

    updateChartData(res.data);
  } catch (err) {
    console.error("Error fetching percentage data:", err);
  }
};

// Function to update chart data
const updateChartData = (data: PercentageItem[]) => {
  const formattedData = data.map((item) => ({
    x: new Date(item.timeBlock),
    y: item.yesPercentage,
  }));

  // Update chartData.value using new arrays to trigger reactivity
  chartData.value = {
    datasets: [
      {
        label: "Yes Percentage",
        data: formattedData.map((item) => ({ x: item.x.getTime(), y: item.y })), // Convert Date to timestamp
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.4, // Smoothing between points
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
const handleNewSubmission = (): void => {
  // Fetch the latest percentage data instead of appending
  fetchPercentageData();
};

// Lifecycle hooks to manage data fetching and real-time updates
onMounted(() => {
  fetchPercentageData();

  // Listen for 'newSubmission' events from the server
  socket.on("newSubmission", handleNewSubmission);
});

onUnmounted(() => {
  // Clean up the socket connection when the component is unmounted
  socket.off("newSubmission", handleNewSubmission);
  socket.disconnect();
});

// Handler for date range updates from DatePicker
const handleDateRangeUpdate = (dateRange: {
  startDate: string;
  endDate: string;
}) => {
  selectedDateRange.value.startDate = dateRange.startDate;
  selectedDateRange.value.endDate = dateRange.endDate;
  fetchPercentageData();
};

// Optional: Watch for changes in selectedDateRange to refetch data
watch(selectedDateRange, () => {
  fetchPercentageData();
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
