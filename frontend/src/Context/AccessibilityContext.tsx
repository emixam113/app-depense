import { createContext, useContext, useState, ReactNode } from "react";

type AccessibilityContextType = {
    accessibleFont: boolean;
    toggleFont: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [accessibleFont, setAccessibleFont] = useState(false);

    const toggleFont = () => setAccessibleFont((prev) => !prev);

    return (
        <AccessibilityContext.Provider value={{ accessibleFont, toggleFont }}>
            <div className={accessibleFont ? "font-[Atkinson_Hyperlegible]" : "font-[Poppins]"}>
                {children}
            </div>
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error("useAccessibility must be used within AccessibilityProvider");
    }
    return context;
}
