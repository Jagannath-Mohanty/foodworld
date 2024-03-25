import jwt from "jsonwebtoken";
import User from "../model/userSchema.js";

const Authenticate = async (req, res, next) => {
  try {
    const token = req.body.token;
    console.log("===========>from backend" + token);
    let newTok = token.replace(/"/g, "");
    const verifyToken = jwt.verify(newTok, process.env.SECRET_KEY);

    const rootUser = await User.findOne({
      _id: verifyToken._id,
      "tokens.token": newTok,
    });
    if (!rootUser) {
      throw new Error("User not found in database");
    }

    req.token = newTok;
    req.rootUser = rootUser;
    console.log("Root User:", req.rootUser);

    req.userID = rootUser._id;
    req.role = rootUser.role;

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
    console.log("Error from Authenticate:", error.message);
  }
};

export default Authenticate;
