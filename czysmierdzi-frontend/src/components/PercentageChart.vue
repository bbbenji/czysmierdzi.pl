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
  ChartData,
  ChartOptions,
} from "chart.js";

import DatePicker from "./DatePicker.vue";

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
  labels: [],
  datasets: [
    {
      label: "Yes Percentage",
      data: [],
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
      type: "category",
      ticks: {
        autoSkip: true,
        maxTicksLimit: 10,
      },
    },
  },
});

// Function to interpolate between two data points
const interpolate = (start: number, end: number, steps: number): number[] => {
  const result: number[] = [];
  const stepSize = (end - start) / steps;
  for (let i = 1; i <= steps; i++) {
    result.push(start + stepSize * i);
  }
  return result;
};

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

    const interpolatedData = interpolateChartData(res.data);
    updateChartData(interpolatedData);
  } catch (err) {
    console.error("Error fetching percentage data:", err);
  }
};

// Function to interpolate data between points
const interpolateChartData = (data: PercentageItem[]): PercentageItem[] => {
  const interpolatedData: PercentageItem[] = [];
  for (let i = 0; i < data.length - 1; i++) {
    interpolatedData.push(data[i]); // Add the original data point

    // Add interpolated values between this point and the next one
    const interpolatedValues = interpolate(
      data[i].yesPercentage,
      data[i + 1].yesPercentage,
      5 // You can adjust this number to increase/decrease the number of interpolated points
    );

    interpolatedValues.forEach((value, index) => {
      // Create a fake timeBlock for interpolated points (could use a midpoint or fractional timestamp)
      const interpolatedTimeBlock = new Date(
        new Date(data[i].timeBlock).getTime() +
          ((new Date(data[i + 1].timeBlock).getTime() -
            new Date(data[i].timeBlock).getTime()) /
            (interpolatedValues.length + 1)) *
            (index + 1)
      ).toISOString();

      interpolatedData.push({
        timeBlock: interpolatedTimeBlock,
        yesPercentage: value,
        totalSubmissions: 0, // Set to 0 for interpolated values since they are not real data points
      });
    });
  }

  // Push the last data point without interpolation
  if (data.length > 0) {
    interpolatedData.push(data[data.length - 1]);
  }

  return interpolatedData;
};

// Function to update chart data
const updateChartData = (data: PercentageItem[]) => {
  const labels = data.map((item) => new Date(item.timeBlock).toLocaleString());
  const percentages = data.map((item) => item.yesPercentage);

  // Update chartData.value using new arrays to trigger reactivity
  chartData.value = {
    labels,
    datasets: [
      {
        label: "Yes Percentage",
        data: percentages,
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
