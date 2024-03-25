import express, { json } from "express";
import authRouter from "./router/auth.js";
import mongoose from "mongoose";
mongoose
  .connect("mongodb://localhost:27017/test")
  .then(() => {
    console.log("connection successfull");
  })
  .catch((error) => {
    console.log(error);
  });
const app = express();

app.use(json());

app.use(authRouter);

app.listen(5000, () => {
  console.log("Server running successfull 5000");
});
