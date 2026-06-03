import React, { useContext, useState, useEffect } from "react";
import { assets } from "../../assets/assets";
import "./Nav.css";
import { Link } from "react-router-dom";
import { FaRegUserCircle } from "react-icons/fa";
import { MdShoppingCart } from "react-icons/md";
import { MdAdminPanelSettings } from "react-icons/md";
import { StoreContext } from "../../context/StoreContext";
import LocationSelector from "../../components/LocationSelector/LocationSelector";
import SearchBar from "../../components/SearchBar/SearchBar";

const Navbar = () => {
  const { getTotalCartItem } = useContext(StoreContext);

  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    const totalItems = getTotalCartItem();
    console.log(getTotalCartItem());
    setCartCount(totalItems);
  };

  useEffect(() => {
    updateCartCount();
  }, [getTotalCartItem()]);

  return (
    <div className="navbar">
      <div className="navbar-left">
        <img
          src="https://logos-world.net/wp-content/uploads/2020/12/Zomato-Logo.jpg"
          alt=""
          className="zomato-logo"
        />
        <LocationSelector />
      </div>
      <SearchBar />
      <ul className="navbar-menu">
        <Link to="/" className="active">
          Home
        </Link>
        <Link to="/restaurants">Restaurants</Link>
        <Link to="/contact-us">Contact</Link>
      </ul>
      <div className="navbar-right">
        <div className="icons">
          <Link to="/admin">
            <MdAdminPanelSettings className="admin " />
          </Link>
        </div>
        <div className="cart-icon">
          <div className="add-count">{cartCount}</div>
          <Link to="/cart">
            <MdShoppingCart className="cart" />
          </Link>
        </div>
        <div className="navbar-search-icon">
          <Link to="/login">
            <FaRegUserCircle className="user" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
