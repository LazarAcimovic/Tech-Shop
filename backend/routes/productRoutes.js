import express from "express";
const router = express.Router();
import connectDB from "../config/db.js";
import {
  getProducts,
  getProductById,
  createProductReview,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

export const db = await connectDB();

router.route("/").get(getProducts);
router.route("/:product_id").get(getProductById);
router.route("/:id/reviews").post(protect, createProductReview);

export default router;
