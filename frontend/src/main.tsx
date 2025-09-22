import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {AccessibilityProvider} from "./Context/AccessibilityContext.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AccessibilityProvider>
            <App />
        </AccessibilityProvider>
    </React.StrictMode>,
)
