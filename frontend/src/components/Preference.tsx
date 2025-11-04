import React from "react";
import { useTheme } from "../Context/ThemeContext";

const Preferences: React.FC = () => {
	const { theme, toggleTheme } = useTheme();

	return (
		<div
			className={`min-h-screen p-6 transition-colors duration-500 ${
				theme === "light"
					? "bg-[#a8e6cf] text-gray-900"
					: "bg-[#0e0e0e] text-gray-100"
			}`}
		>
			<div className="max-w-xl mx-auto bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
				<h1 className="text-2xl font-bold mb-4">Préférences</h1>

				<div className="flex justify-between items-center mb-6">
					<span className="text-lg font-medium">Thème</span>

					<div className="flex gap-4">
						<button
							onClick={() => theme === "dark" && toggleTheme()}
							className={`px-4 py-2 rounded ${
								theme === "light"
									? "bg-green-500 text-white"
									: "bg-gray-300 text-gray-800 hover:bg-gray-400"
							}`}
						>
							Clair
						</button>

						<button
							onClick={() => theme === "light" && toggleTheme()}
							className={`px-4 py-2 rounded ${
								theme === "dark"
									? "bg-green-500 text-white"
									: "bg-gray-300 text-gray-800 hover:bg-gray-400"
							}`}
						>
							Sombre
						</button>
					</div>
				</div>

				<p className="opacity-75 text-sm">
					Le thème est sauvegardé dans vos préférences et s’appliquera à tout le
					site.
				</p>
			</div>
		</div>
	);
};

export default Preferences;
