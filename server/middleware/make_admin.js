import Customers from "../model/userSchema.js";

const MakeAdmin = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const { category } = req.body;
    console.log("======>From MakeAdmin " + user_id);
    console.log("------> " + category);

    try {
      if (category === true) {
        const user = await Customers.findByIdAndUpdate(user_id, {
          role: "user",
        });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.sendStatus(200);
      } else if (category === false) {
        const user = await Customers.findByIdAndUpdate(user_id, {
          role: "admin",
        });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.sendStatus(200);
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
    next();
  } catch (error) {
    console.error("Error from Authenticate_Admin:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export default MakeAdmin;
