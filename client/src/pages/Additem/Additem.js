import React, { useState } from "react";
import "./Additem.css";
import { StoreContext } from "../../context/StoreContext";
import { menu_list, food_list } from "../../assets/assets";
const AddItem = () => {
  const [product, setProduct] = useState({
    // image: "",
    // name: "",
    // description: "",
    // category: "",
    // price: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Product data:", product);
    const data = {
      image: "",
      name: "",
      description: "",
      category: "",
      price: "",
    };
    setProduct(data);
    // setProduct({
    //   image: "",
    //   name: "",
    //   description: "",
    //   category: "",
    //   price: "",
    // });
  };
  console.log(product);

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div>
          <input
            className="image-box"
            placeholder="Enter Item Id"
            type="file"
            id="image"
            name="image"
            value={product.image}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <input
            className="image-box"
            type="file"
            id="image"
            name="image"
            value={product.image}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <input
            className="input-field"
            placeholder="Enter Item Name"
            type="text"
            id="name"
            name="name"
            value={product.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <textarea
            className="input-field"
            placeholder="Enter Description"
            id="description"
            name="description"
            value={product.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <input
            placeholder="Enter Item Category"
            className="input-field"
            type="text"
            id="category"
            name="category"
            value={product.category}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <input
            className="input-field"
            placeholder="Enter Item Price"
            type="amount"
            id="price"
            name="price"
            value={product.price}
            onChange={handleChange}
            required
          />
        </div>
        <button className="item-submit-button" type="submit">
          Add
        </button>
      </form>
    </div>
  );
};

export default AddItem;
