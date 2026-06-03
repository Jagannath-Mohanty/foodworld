import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DeliveryLayout from "./components/DeliveryLayout/DeliveryLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Toasts from "./components/Toasts/Toasts";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

const App = () => (
  <>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DeliveryLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    <Toasts />
  </>
);

export default App;
