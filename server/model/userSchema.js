import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import Order from "../model/Order.js";

config({ path: "./config.env" });
const { hash } = bcrypt;
const { sign } = jwt;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  role: {
    type: String,
  },
  orders: [
    {
      type: [],
      ref: "Order",
    },
  ],
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hash(this.password, 12);
  }
  next();
});

userSchema.methods.generateAuthToken = function () {
  try {
    console.log(this._id);
    let token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
    this.tokens = this.tokens.concat({ token: token });
    this.save();
    return token;
  } catch (err) {
    console.log("Error from generateAuthToken" + err);
  }
};

const Customers = mongoose.model("Customers", userSchema);
export default Customers;
