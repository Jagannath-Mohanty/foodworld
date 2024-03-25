// import { connect } from "mongoose";
// export default () => {
//   connect("mongodb://localhost:27017/test")
//     .then(() => console.log("Connection Successfull"))
//     .catch((error) => console.log(error));
// };
// const dbcon = connect("mongodb://localhost:27017/test")
//   .then(() => console.log("Connection Successfull"))
//   .catch((error) => console.log(error));

// export default dbcon;

import mongoose from "mongoose";

export default async function connectToDatabase() {
  try {
    await mongoose.connect("mongodb://localhost:27017/test");
    console.log("Connection Successful");
  } catch (error) {
    console.error("Connection Error:", error);
  }
}
