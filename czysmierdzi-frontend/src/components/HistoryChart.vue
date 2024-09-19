<!-- src/components/HistoryChart.vue -->
<template>
  <div class="my-4">
    <LineChart :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

export default {
  components: {
    LineChart: Line,
  },
  props: {
    history: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  computed: {
    chartData() {
      // Ensure history is an array
      const validHistory = Array.isArray(this.history) ? this.history : [];

      const labels = validHistory.map((item) =>
        new Date(item.timestamp).toLocaleString()
      );
      const data = validHistory.map((item) => {
        if (item.status === "yes") return 1;
        if (item.status === "no") return -1;
        return 0;
      });
      return {
        labels,
        datasets: [
          {
            label: "Smell Status",
            data,
            fill: false,
            borderColor: "rgba(75, 192, 192, 1)",
            tension: 0.1,
          },
        ],
      };
    },
    chartOptions() {
      return {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
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
              callback: function (value) {
                if (value === 1) return "Yes";
                if (value === -1) return "No";
                return "Uncertain";
              },
            },
          },
        },
      };
    },
  },
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
