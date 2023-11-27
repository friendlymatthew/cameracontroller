import type { Logs } from "@tensorflow/tfjs";
import "chart.js/auto";
import Chart from "chart.js/auto";
import { useEffect, useRef } from "react";

interface ModelGraphProps {
  logs: Logs[];
}

export default function ModelGraph({ logs }: ModelGraphProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");

      if (ctx) {
        const lossData = logs.map((log) => log.loss);
        const accuracyData = logs.map((log) => log.acc);
        const dataLength = logs.length;

        const chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: [...Array(dataLength).keys()],
            datasets: [
              {
                label: "Accuracy",
                data: accuracyData,
                fill: false,
                borderColor: "#6da34d",
                tension: 0.1,
              },
              {
                label: "Loss",
                data: lossData,
                fill: false,
                borderColor: "#bd0f15",
                tension: 0.1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                min: 0,
                max: 1,
                ticks: {
                  stepSize: 0.1,
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Epochs",
                },
              },
            },
          },
        });
        return () => chart.destroy();
      }
    }
  }, [logs]);

  return <canvas className="h-56" ref={chartRef} />;
}
