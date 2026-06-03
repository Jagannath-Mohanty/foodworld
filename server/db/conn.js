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


// const databaseURL = "mongodb://localhost:27017/test";
const databaseURL = process.env.MONGODB_URL;

export default async function connectToDatabase() {
  try {
    await mongoose.connect(databaseURL);
    console.log("Connection Successful");
  } catch (error) {
    console.error("Connection Error:", error);
  }
}
