import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryData {
    name: string;
    amount: number;
    color: string;
}

interface GraphProps {
    data: Record<string, number>; // ex: { "Alimentation": 120, "Transport": 50 }
    color: Record<string, string>; // ex: { "Alimentation": "#FF0000", "Transport": "#00FF00" }
}

const Graph = ({ data, color }: GraphProps) => {
    // Transforme les données en tableau utilisable par Chart.js
    const graphData: CategoryData[] = useMemo(() => {
        return Object.entries(data || {}).map(([name, amount]) => ({
            name,
            amount: Number(amount) || 0,
            color: color[name] || "#888888",
        }));
    }, [data, color]);

    const labels = useMemo(() => graphData.map(c => c.name), [graphData]);
    const values = useMemo(() => graphData.map(c => c.amount), [graphData]);
    const colors = useMemo(() => graphData.map(c => c.color), [graphData]);

    // Si aucune donnée
    if (labels.length === 0 || values.every(v => v === 0)) {
        return (
            <div className="bg-white shadow rounded-2xl p-6 w-full">
                <h2 className="text-lg font-semibold mb-4">Répartition budgétaire</h2>
                <p className="text-gray-500">Aucune donnée disponible pour l'instant.</p>
            </div>
        );
    }

    const chartData = useMemo(
        () => ({
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: "#fff",
                    hoverOffset: 10,
                },
            ],
        }),
        [labels, values, colors]
    );

    const options: ChartOptions<"pie"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: "circle",
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || "";
                        const value = Number(context.raw) || 0;
                        const dataset = context.dataset.data as number[];
                        const total = dataset.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";
                        return `${label}: ${value.toFixed(2)} € (${percentage}%)`;
                    },
                },
            },
        },
    };

    return (
        <div className="bg-white shadow rounded-2xl p-6 w-full">
            <h2 className="text-lg font-semibold mb-4 font-sans">
                Répartition budgétaire
            </h2>
            <div className="w-full aspect-square">
                <Pie data={chartData} options={options} />
            </div>
        </div>
    );
};

export default Graph;
