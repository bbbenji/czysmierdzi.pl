<!-- src/components/HistoryChart.vue -->
<template>
  <div class="my-4">
    <LineChart :data="chartData" :options="chartOptions" ref="chartRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { Line as LineChart } from "vue-chartjs"; // Alias Line as LineChart
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

// Define the structure of a history item
interface HistoryItem {
  timestamp: string; // ISO date string or any parsable date string
  status: number; // Numerical status between 0 and 10
}

// Define component props with TypeScript
const props = defineProps<{
  history: HistoryItem[];
}>();

// Define the chart data with proper typing
const chartData = ref<ChartData<"line">>({
  labels: [],
  datasets: [
    {
      label: "Smell Status",
      data: [],
      fill: false,
      borderColor: "rgba(75, 192, 192, 1)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
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
    tooltip: {
      callbacks: {
        label: function (context) {
          return `Status: ${context.parsed.y}`;
        },
      },
    },
  },
  scales: {
    y: {
      min: 0,
      max: 10,
      ticks: {
        stepSize: 1,
        callback: function (value: number | string) {
          return value;
        },
      },
      title: {
        display: true,
        text: "Status (0-10)",
      },
    },
    x: {
      type: "category",
      ticks: {
        autoSkip: true,
        maxTicksLimit: 10,
      },
      title: {
        display: true,
        text: "Timestamp",
      },
    },
  },
});

// Reference to the chart instance (optional, useful for direct manipulation)
const chartRef = ref<InstanceType<typeof LineChart> | null>(null);

// Function to update the chart data based on history prop
const updateChart = () => {
  if (!props.history || props.history.length === 0) {
    chartData.value = {
      labels: [],
      datasets: [
        {
          label: "Smell Status",
          data: [],
          fill: false,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
          pointBackgroundColor: "rgba(75, 192, 192, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(75, 192, 192, 1)",
        },
      ],
    };
    return;
  }

  // Sort history by timestamp to ensure chronological order
  const sortedHistory = [...props.history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const labels = sortedHistory.map((item) =>
    new Date(item.timestamp).toLocaleString()
  );
  const data = sortedHistory.map((item) => item.status);

  chartData.value = {
    labels,
    datasets: [
      {
        label: "Smell Status",
        data,
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(75, 192, 192, 1)",
      },
    ],
  };
};

// Watch for changes in the history prop and update the chart accordingly
watch(
  () => props.history,
  () => {
    updateChart();
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
