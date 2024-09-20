<!-- src/components/HistoryChart.vue -->
<template>
  <div class="my-4">
    <LineChart :data="chartData" :options="chartOptions" />
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
  status: "yes" | "no" | "uncertain";
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

// Reference to the chart instance (optional, useful for direct manipulation)
const chartRef = ref<InstanceType<typeof LineChart> | null>(null);

// Function to update the chart data based on history prop
const updateChart = () => {
  const labels = props.history.map((item) =>
    new Date(item.timestamp).toLocaleString()
  );
  const data = props.history.map((item) => {
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
