import express from "express";
const router = express.Router();
import connectDB from "../config/db.js";
import {
  getProducts,
  getProductById,
} from "../controllers/productController.js";

export const db = await connectDB();

router.route("/").get(getProducts);
router.route("/:product_id").get(getProductById);

export default router;
