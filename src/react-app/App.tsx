import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import LoginPage from "@/react-app/pages/Login";
import DashboardPage from "@/react-app/pages/Dashboard";
import CreateContractPage from "@/react-app/pages/CreateContract";
import SignContractPage from "@/react-app/pages/SignContract";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create-contract" element={<CreateContractPage />} />
        <Route path="/sign/:token" element={<SignContractPage />} />
      </Routes>
    </Router>
  );
}
