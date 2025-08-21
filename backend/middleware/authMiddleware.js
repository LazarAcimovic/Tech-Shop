import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";
import { db } from "../routes/productRoutes.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // čitanje jwt tokena
  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [user] = await db.execute("SELECT * FROM _user WHERE user_id = ?", [
        decoded.userId,
      ]);
      console.log(user);

      const { password, ...userWithoutPassword } = user[0];
      req.user = userWithoutPassword;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};

export { protect, admin };
