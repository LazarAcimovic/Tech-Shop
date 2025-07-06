import { db } from "../routes/productRoutes.js";
import asyncHandler from "../middleware/asyncHandler.js";

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const [products] = await db.execute("SELECT * FROM product");
  res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const [product] = await db.execute(
    "select * from product where product_id = ?",
    [req.params.product_id]
  );

  if (product.length > 0) {
    return res.json(product[0]);
  } else {
    res.status(404);
    throw new Error("Resource not found");
  }
});

export { getProducts, getProductById };
