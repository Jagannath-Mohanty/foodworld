import jwt from "jsonwebtoken";
import Users from "../model/userSchema.js";

const Authenticate_Admin = async (req, res, next) => {
  try {
    // GET requests carry the JWT in the Authorization: Bearer header;
    // POST/PUT/DELETE may send it in the body as `token` (legacy).
    const headerToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const token = headerToken || req.body?.token;
    console.log("Token from backend Authenticate_Admin:", token);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let newTok = token.replace(/"/g, "");
    console.log("Modified Token:", newTok);
    const verifiedToken = jwt.verify(newTok, process.env.SECRET_KEY);
    console.log("Verified Token:", verifiedToken);
    // Stateless token: generateAuthToken signs { id, phone, role, name } and
    // does not persist to a tokens array, so look the user up by id.
    const userId = verifiedToken.id || verifiedToken._id;
    const rootUser = await Users.findById(userId);

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

    const allUsers = await Users.find({});
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
