import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import DashboardPage from "@/react-app/pages/Dashboard";
import CreateContractPage from "@/react-app/pages/CreateContract";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import SignContractPage from "@/react-app/pages/SignContract";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-contract" element={<CreateContractPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/sign/:token" element={<SignContractPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
