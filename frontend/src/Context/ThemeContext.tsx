import React, { createContext, useState, useEffect, useContext } from "react";

interface ThemeContextType {
	theme: "light" | "dark";
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
	theme: "light",
	toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [theme, setTheme] = useState<"light" | "dark">("light");

	// Charger le thème depuis le localStorage
	useEffect(() => {
		const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
		if (savedTheme) {
			setTheme(savedTheme);
			document.documentElement.classList.toggle("dark", savedTheme === "dark");
		}
	}, []);

	// Appliquer le thème et sauvegarder
	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		localStorage.setItem("theme", theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);
