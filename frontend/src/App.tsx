import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordError from "./pages/ForgotPasswordError";
import Dashboard from "./pages/Dashboard";
import Settings from './pages/Settings';

import { AuthProvider, useAuth } from "./context/AuthContext";

// 🔒 Composant de protection des routes
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const { user } = useAuth();

    // Si pas connecté → redirection vers /login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/forgot-password-error" element={<ForgotPasswordError />} />
	                  <Route path="/settings" element={<Settings/>}/>
                    {/* ✅ Dashboard protégé par connexion */}
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;