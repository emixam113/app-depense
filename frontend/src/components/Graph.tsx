import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

type GraphProps = {
    revenus?: Record<string, number>;
    depenses?: Record<string, number>;
    categoryColors: Record<string, string>;
};

export default function Graph({
                                  revenus = {},
                                  depenses = {},
                                  categoryColors,
                              }: GraphProps) {
    const revenusArray = Object.entries(revenus).map(([name, value]) => ({
        name,
        value,
    }));

    const depensesArray = Object.entries(depenses).map(([name, value]) => ({
        name,
        value,
    }));

    // 💶 Formatage en euros
    const formatValue = (val: number) =>
        val.toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }) + " €";

    // 🏷️ Label personnalisé
    const renderCustomLabel = ({ name, value }: { name: string; value: number }) =>
        `${name}: ${formatValue(value)}`;

    // 🎨 Couleurs par défaut (fallback)
    const defaultColors = [
        "#00C49F", // vert
        "#0088FE", // bleu
        "#FFBB28", // jaune
        "#FF8042", // orange
        "#AA66CC", // violet
        "#FF6699", // rose
        "#33B5E5", // cyan
        "#99CC00", // vert clair
    ];

    return (
        <div className="flex flex-col lg:flex-row justify-center items-center gap-10 mt-10">
            {/* === REVENUS === */}
            <div className="flex flex-col items-center">
                <h4 className="text-lg font-semibold mb-3"> Revenus par source</h4>
                {revenusArray.length > 0 ? (
                    <PieChart
                        width={480}
                        height={480}
                        margin={{  top: 60, right: 80, bottom: 250, left: 150 }}
                    >
                        <Pie
                            data={revenusArray}
                            cx="36%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            dataKey="value"
                            label={renderCustomLabel}
                            labelLine={{ stroke: "#ccc", strokeWidth: 1 }}
                        >
                            {revenusArray.map((entry, index) => (
                                <Cell
                                    key={`revenu-${index}`}
                                    fill={
                                        categoryColors[entry.name] ||
                                        defaultColors[index % defaultColors.length]
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => formatValue(value)}
                            contentStyle={{ fontSize: "14px" }}
                        />
                        <Legend wrapperStyle={{
                            fontSize: "15px",
                            top: "250px",
                            left: "10px",

                        }} iconType="circle" />
                    </PieChart>
                ) : (
                    <p className="text-gray-500 italic">Aucun revenu à afficher</p>
                )}
            </div>

            {/* === DÉPENSES === */}
            <div className="flex flex-col items-center lg:-ml-8">
                <h4 className="text-lg font-semibold mb-3"> Dépenses par catégorie</h4>
                {depensesArray.length > 0 ? (
                    <PieChart
                        width={480}
                        height={480}
                        margin={{ top: 60, right: 20, bottom: 250, left: 10 }}
                    >
                        <Pie
                            data={depensesArray}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            dataKey="value"
                            label={renderCustomLabel}
                            labelLine={{ stroke: "#ccc", strokeWidth: 1 }}
                        >
                            {depensesArray.map((entry, index) => (
                                <Cell
                                    key={`depense-${index}`}
                                    fill={
                                        categoryColors[entry.name] ||
                                        defaultColors[index % defaultColors.length]
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => formatValue(value)}
                            contentStyle={{ fontSize: "15px" }}
                        />
                        <Legend wrapperStyle= {{
                            fontSize: "15px",
                            right: "10px ",

                            bottom:"192px"

                        }}
                                iconType="circle"

                        />
                    </PieChart>
                ) : (
                    <p className="text-gray-500 italic">Aucune dépense à afficher</p>
                )}
            </div>
        </div>
    );
}
