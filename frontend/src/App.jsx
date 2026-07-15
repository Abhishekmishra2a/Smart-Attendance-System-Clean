import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import FaceScan from "./pages/FaceScan";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RegisterStudent from "./pages/RegisterStudent";
import AttendanceHistory from "./pages/AttendanceHistory";

function App() {
  return (
    <HashRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/register" element={<RegisterStudent />} />

        <Route
          path="/attendance-history"
          element={<AttendanceHistory />}
        />

        <Route
          path="/face-scan"
          element={<FaceScan />}
       />

      </Routes>

    </HashRouter>
  );
}

export default App;