import React, { useState } from "react";
import Header from "../../components/Header/Header";
import "./Home.css";
import Menu from "../../components/Menu/Menu";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";

const Home = () => {
  const [category, setCategory] = useState("All");
  return (
    <div>
      <Header />
      <Menu category={category} setCategory={setCategory} />
      <FoodDisplay category={category} />
    </div>
  );
};

export default Home;
