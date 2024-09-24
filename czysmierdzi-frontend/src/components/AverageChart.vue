<!-- src/components/AverageChart.vue -->
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

// Define the structure of an average data item
interface AverageItem {
  windowStart: string; // ISO date string
  averageStatus: number; // Average status value
}

// Define component props with TypeScript
const props = defineProps<{
  averages: AverageItem[];
}>();

// Define the chart data with proper typing
const chartData = ref<ChartData<"line">>({
  labels: [],
  datasets: [
    {
      label: "Average Smell Status",
      data: [],
      fill: false,
      borderColor: "rgba(153, 102, 255, 1)",
      backgroundColor: "rgba(153, 102, 255, 0.2)",
      tension: 0.1,
      pointBackgroundColor: "rgba(153, 102, 255, 1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(153, 102, 255, 1)",
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
      text: "Average Smell Status (15-Minute Intervals)",
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          return `Average Status: ${context.parsed.y}`;
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
        text: "Average Status (0-10)",
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
        text: "Time Window Start",
      },
    },
  },
});

// Reference to the chart instance (optional, useful for direct manipulation)
const chartRef = ref<InstanceType<typeof LineChart> | null>(null);

// Function to update the chart data based on averages prop
const updateChart = () => {
  if (!props.averages || props.averages.length === 0) {
    chartData.value = {
      labels: [],
      datasets: [
        {
          label: "Average Smell Status",
          data: [],
          fill: false,
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          tension: 0.1,
          pointBackgroundColor: "rgba(153, 102, 255, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(153, 102, 255, 1)",
        },
      ],
    };
    return;
  }

  // Sort averages by windowStart to ensure chronological order
  const sortedAverages = [...props.averages].sort(
    (a, b) =>
      new Date(a.windowStart).getTime() - new Date(b.windowStart).getTime()
  );

  const labels = sortedAverages.map((item) =>
    new Date(item.windowStart).toLocaleString()
  );
  const data = sortedAverages.map((item) => item.averageStatus);

  chartData.value = {
    labels,
    datasets: [
      {
        label: "Average Smell Status",
        data,
        fill: false,
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        tension: 0.1,
        pointBackgroundColor: "rgba(153, 102, 255, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(153, 102, 255, 1)",
      },
    ],
  };
};

// Watch for changes in the averages prop and update the chart accordingly
watch(
  () => props.averages,
  () => {
    updateChart();
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
