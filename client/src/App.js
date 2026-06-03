import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./pages/Navbar/Navbar";
import Home from "./pages/Home/Home";
// import About from "./components/About";
import Contact from "./components/Contact";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Admin from "./pages/Admin/Admin";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import AddItem from "./pages/Additem/Additem";
import ItemDetails from "./pages/ItemDetails/ItemDetails";
import Restaurants from "./pages/Restaurants/Restaurants";
import Search from "./pages/Search/Search";
import Toasts from "./components/Toasts/Toasts";
import RestaurantDetails from "./pages/RestaurantDetails/RestaurantDetails";
import DeliveryDashboard from "./pages/DeliveryDashboard/DeliveryDashboard";
import OrderTracking from "./pages/OrderTracking/OrderTracking";

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/about" element={<About />} /> */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/order" element={<PlaceOrder />} />
        <Route path="/additem" element={<AddItem />} />
        <Route path="/item-details/:id" element={<ItemDetails />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/search" element={<Search />} />
        <Route path="/restaurants/:id" element={<RestaurantDetails />} />
        <Route path="/delivery" element={<DeliveryDashboard />} />
        <Route path="/orders/:id" element={<OrderTracking />} />
      </Routes>
      <Toasts />
    </div>
  );
};

export default App;
