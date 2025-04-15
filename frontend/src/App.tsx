import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from "./pages/Home.tsx"
import Login from "./pages/Login.tsx"
import Inscription from "./pages/Inscription.tsx"

function App() {


  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/Login" element={<Login/>}/>
          <Route path="/Inscription" element={<Inscription/>}/>
        </Routes>
      </Router>
  )
}

export default App
