<!-- src/components/AverageChart.vue -->
<template>
  <div class="my-4">
    <div class="flex justify-end">
      <DatePicker @update:dateRange="handleDateRangeUpdate" />
    </div>
    <LineChart :data="chartData" :options="chartOptions" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import DatePicker from "./DatePicker.vue";
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
  Filler,
  ChartData,
  ChartOptions,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns"; // Import the date adapter

// Register necessary Chart.js components, including TimeScale
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  TimeScale // Register the TimeScale
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

// Define the chart options with a time-based x-axis
const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Average Smell Status (15-Minute Intervals)",
    },
    tooltip: {
      callbacks: {
        label: (context) => `Average Status: ${context.parsed.y}`,
      },
    },
  },
  scales: {
    y: {
      min: 0,
      max: 10,
      ticks: {
        stepSize: 1,
        callback: (value: number | string) => value,
      },
      title: {
        display: true,
        text: "Average Status (0-10)",
      },
    },
    x: {
      min: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      max: new Date().toISOString(),
      type: "time",
      time: {
        unit: "hour",
        displayFormats: {
          minute: "MMM d, HH:mm",
          hour: "MMM d, HH:mm",
          day: "MMM d",
        },
        tooltipFormat: "PPpp",
      },
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
};

// Define the chart data as a computed property
const chartData = computed<ChartData<"line">>(() => {
  if (!props.averages || props.averages.length === 0) {
    return {
      datasets: [
        {
          label: "Average Smell Status",
          data: [],
          fill: true,
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          tension: 0.1,
          pointBackgroundColor: "rgba(153, 102, 255, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(153, 102, 255, 1)",
          spanGaps: true,
        },
      ],
    };
  }

  // Sort averages by windowStart to ensure chronological order
  const sortedAverages = [...props.averages].sort(
    (a, b) =>
      new Date(a.windowStart).getTime() - new Date(b.windowStart).getTime()
  );

  const data = sortedAverages.map((item) => ({
    x: item.windowStart, // Use raw date string or Date object
    y: item.averageStatus,
  }));

  return {
    datasets: [
      {
        label: "Average Smell Status",
        data,
        fill: true,
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        tension: 0.5, // Increased tension for smoother lines
        pointBackgroundColor: "rgba(153, 102, 255, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(153, 102, 255, 1)",
        spanGaps: true,
      },
    ],
  };
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
