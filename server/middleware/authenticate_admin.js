import jwt from "jsonwebtoken";
import Customers from "../model/userSchema.js";

const Authenticate_Admin = async (req, res, next) => {
  try {
    const token = req.body.token;
    console.log("Token from backend Authenticate_Admin:", token);
    let newTok = token.replace(/"/g, "");
    console.log("Modified Token:", newTok);
    const verifiedToken = jwt.verify(newTok, process.env.SECRET_KEY);
    console.log("Verified Token:", verifiedToken);
    const rootUser = await Customers.findOne({
      _id: verifiedToken._id,
      "tokens.token": newTok,
    });

    console.log("Root User:", rootUser);

    if (!rootUser) {
      throw new Error("User not found in database");
    }

    req.token = newTok;
    req.rootUser = rootUser;
    req.userID = rootUser._id;
    req.role = rootUser.role;
    console.log("Role:", req.role);
    const { role } = rootUser;
    console.log("======>", role);

    const allUsers = await Customers.find({});
    console.log("All Users:", allUsers);
    req.allUsers = allUsers;

    if (req.role !== "admin") {
      // alert("Sorry! Only Admin Can Access");
      return res.status(401).json({ error: "Unauthorized Person" });
    } else {
      req.allUsers = allUsers;
      next();
    }
  } catch (error) {
    console.error("Error from Authenticate_Admin:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export default Authenticate_Admin;
