import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";
import Menu from "../../components/Menu/Menu";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import RestaurantCard from "../../components/RestaurantCard/RestaurantCard";
import "./Home.css";

const Home = () => {
  const [category, setCategory] = useState("All");
  const [popularRestaurants, setPopularRestaurants] = useState([]);

  useEffect(() => {
    fetch("/api/restaurants?limit=6&page=1")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setPopularRestaurants(Array.isArray(data.items) ? data.items : []))
      .catch(() => setPopularRestaurants([]));
  }, []);

  return (
    <div>
      <Header />
      <Menu category={category} setCategory={setCategory} />

      {popularRestaurants.length > 0 && (
        <section className="home-restaurants">
          <div className="home-restaurants-head">
            <h2>Popular restaurants</h2>
            <Link to="/restaurants" className="home-restaurants-link">
              See all →
            </Link>
          </div>
          <div className="home-restaurants-grid">
            {popularRestaurants.map((r) => (
              <RestaurantCard key={r._id} restaurant={r} />
            ))}
          </div>
        </section>
      )}

      <FoodDisplay category={category} />
    </div>
  );
};

export default Home;
