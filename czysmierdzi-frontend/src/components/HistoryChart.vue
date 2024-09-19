<!-- src/components/HistoryChart.vue -->
<template>
  <div class="my-4">
    <LineChart :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { ref, watch } from "vue";
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
  setup(props) {
    const chartData = ref({
      labels: [],
      datasets: [
        {
          label: "Smell Status",
          data: [],
          fill: false,
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.1,
        },
      ],
    });

    const chartOptions = ref({
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
    });

    const chartRef = ref(null);

    // Updated function to replace chartData object
    const updateChart = () => {
      const labels = props.history.map((item) =>
        new Date(item.timestamp).toLocaleString()
      );
      const data = props.history.map((item) => {
        if (item.status === "yes") return 1;
        if (item.status === "no") return -1;
        return 0;
      });
      // console.log("Labels:", labels);
      // console.log("Data:", data);
      chartData.value = {
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
    };

    // Updated watcher without manual chart update
    watch(
      () => props.history,
      () => {
        updateChart();
        // Manual update removed
      },
      { immediate: true, deep: true }
    );

    return {
      chartData,
      chartOptions,
      chartRef,
    };
  },
};
</script>
