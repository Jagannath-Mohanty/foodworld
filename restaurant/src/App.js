import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RestaurantLayout from "./components/RestaurantLayout/RestaurantLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Toasts from "./components/Toasts/Toasts";
import Login from "./pages/Login/Login";
import Onboarding from "./pages/Onboarding/Onboarding";
import Dashboard from "./pages/Dashboard/Dashboard";
import Categories from "./pages/Categories/Categories";
import Menu from "./pages/Menu/Menu";
import Orders from "./pages/Orders/Orders";
import Profile from "./pages/Profile/Profile";

const App = () => (
  <>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute requireOnboarded>
            <RestaurantLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/account" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    <Toasts />
  </>
);

export default App;
