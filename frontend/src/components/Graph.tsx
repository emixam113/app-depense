import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface GraphProps {
  data: { [category: string]: number };
}

export const Graph = ({ data }: GraphProps) => {
  const colors = [
    '#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa',
    '#f472b6', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'
  ];

  const labels = Object.keys(data);
  const values = Object.values(data);

  // Message si aucune donnée
  if (labels.length === 0) {
    return (
      <div className="bg-white shadow rounded-2xl p-6 w-full">
        <h2 className="text-lg font-semibold mb-4">Répartition budgétaire</h2>
        <p className="text-gray-500">Aucune donnée disponible pour l'instant.</p>
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map((_, i) => colors[i] || '#d1d5db'), // gris clair par défaut si > 10
      borderWidth: 1,
      borderColor: '#fff',
      hoverOffset: 10,
    }],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: { label?: string | null; raw: unknown; dataset: { data: unknown[] } }) {
            const label = context.label || '';
            const rawValue = context.raw;
            const value = typeof rawValue === 'number' ? rawValue : typeof rawValue === 'string' ? parseFloat(rawValue) : 0;
            const dataset = context.dataset.data as number[];
            const total = dataset.reduce((acc, curr) => acc + Number(curr), 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white shadow rounded-2xl p-6 w-full">
      <h2 className="text-lg font-semibold mb-4">Répartition budgétaire</h2>
      <div className="h-80">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};
