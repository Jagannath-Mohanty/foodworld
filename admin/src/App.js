import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Toasts from "./components/Toasts/Toasts";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Restaurants from "./pages/Restaurants/Restaurants";
import RestaurantForm from "./pages/Restaurants/RestaurantForm";
import RestaurantMenu from "./pages/Restaurants/RestaurantMenu";
import Orders from "./pages/Orders/Orders";
import Coupons from "./pages/Coupons/Coupons";
import Users from "./pages/Users/Users";
import DeliveryAgents from "./pages/DeliveryAgents/DeliveryAgents";

const App = () => (
  <>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/new" element={<RestaurantForm />} />
        <Route path="/restaurants/:id/edit" element={<RestaurantForm />} />
        <Route path="/restaurants/:id/menu" element={<RestaurantMenu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/users" element={<Users />} />
        <Route path="/delivery-agents" element={<DeliveryAgents />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    <Toasts />
  </>
);

export default App;
