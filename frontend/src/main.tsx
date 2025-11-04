import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {AccessibilityProvider} from "./Context/AccessibilityContext.tsx";
import {ThemeProvider} from './Context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
	    <ThemeProvider>
          <AccessibilityProvider>
              <App />
					</AccessibilityProvider>
	    </ThemeProvider>
    </React.StrictMode>,
)
