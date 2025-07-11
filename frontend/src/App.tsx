import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from "./pages/Home.tsx"
import Login from "./pages/Login.tsx"
import ForgotPassword from './pages/ForgotPassword.tsx'
import Signup from './pages/Signup.tsx'
import Dashboard from './pages/Dashboard.tsx';
import ForgotPasswordError from './pages/ForgotPasswordError.tsx';
function App() {


  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>}/>
          <Route path="/signup" element={<Signup/>}/>
          <Route path="/forgot-password" element={<ForgotPassword/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/forgot-password-error" element={<ForgotPasswordError/>}/>
          
        </Routes>
      </Router>
  )
}

export default App
