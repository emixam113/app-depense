import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

type GraphProps = {
    revenus?: Record<string, number>;
    depenses?: Record<string, number>;
    categoryColors: Record<string, string>;
};

export default function Graph({ revenus = {}, depenses = {}, categoryColors }: GraphProps) {
    const revenusArray = Object.entries(revenus).map(([name, value]) => ({ name, value }));
    const depensesArray = Object.entries(depenses).map(([name, value]) => ({ name, value }));

    return (
        <>
            {/* Donut Revenus */}
            <div className="flex flex-col items-center">
                <h4 className="text-lg font-medium mb-2">💰 Revenus par source</h4>
                {revenusArray.length > 0 ? (
                    <PieChart width={300} height={300}>
                        <Pie
                            data={revenusArray}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            dataKey="value"
                            label
                        >
                            {revenusArray.map((entry, index) => (
                                <Cell key={`revenu-${index}`} fill={categoryColors[entry.name]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                ) : (
                    <p className="text-gray-500 italic">Aucun revenu à afficher</p>
                )}
            </div>

            {/* Donut Dépenses */}
            <div className="flex flex-col items-center">
                <h4 className="text-lg font-medium mb-2">💸 Dépenses par catégorie</h4>
                {depensesArray.length > 0 ? (
                    <PieChart width={300} height={300}>
                        <Pie
                            data={depensesArray}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            dataKey="value"
                            label
                        >
                            {depensesArray.map((entry, index) => (
                                <Cell key={`depense-${index}`} fill={categoryColors[entry.name]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                ) : (
                    <p className="text-gray-500 italic">Aucune dépense à afficher</p>
                )}
            </div>
        </>
    );
}
