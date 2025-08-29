import { useMemo } from 'react';
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

  // Labels et valeurs mémorisés
  const labels = useMemo(() => Object.keys(data), [data]);
  const values = useMemo(() => Object.values(data).map(v => Math.abs(v)), [data]);

  // Cas où il n'y a pas de données
  if (labels.length === 0 || values.every(v => v === 0)) {
    return (
        <div className="bg-white shadow rounded-2xl p-6 w-full">
          <h2 className="text-lg font-semibold mb-4">Répartition budgétaire</h2>
          <p className="text-gray-500">Aucune donnée disponible pour l'instant.</p>
        </div>
    );
  }

  // chartData mémorisé
  const chartData = useMemo(() => ({
    labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map((_, i) => colors[i] || '#d1d5db'),
      borderWidth: 1,
      borderColor: '#fff',
      hoverOffset: 10,
    }]
  }), [labels, values]);

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false, // permet de remplir le conteneur
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
          label: function (context) {
            const label = context.label || '';
            const rawValue = context.raw;
            const value = typeof rawValue === 'number'
                ? Math.abs(rawValue)
                : typeof rawValue === 'string'
                    ? Math.abs(parseFloat(rawValue))
                    : 0;

            const dataset = context.dataset.data as number[];
            const total = dataset.reduce((acc, curr) => acc + Math.abs(Number(curr)), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';

            return `${label}: ${value.toFixed(2)} € (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
      <div className="bg-white shadow rounded-2xl p-6 w-full">
        <h2 className="text-lg font-semibold mb-4 font-sans">Répartition budgétaire</h2>
        <div className="w-full aspect-square">
          <Pie data={chartData} options={options} />
        </div>
      </div>
  );
};
