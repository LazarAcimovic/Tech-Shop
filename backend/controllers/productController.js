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
  const [productRows] = await db.execute(
    "SELECT * FROM product WHERE product_id = ?",
    [req.params.product_id]
  );

  if (productRows.length === 0) {
    res.status(404);
    throw new Error("Product not found");
  }

  const productData = productRows[0];

  const [reviewRows] = await db.execute(
    `
    SELECT r.*, u.name AS user_name
    FROM review r
    JOIN _user u ON r.user_id = u.user_id
    WHERE r.product_id = ?
  `,
    [req.params.product_id]
  );

  const product = {
    product_id: productData.product_id,
    name: productData.name,
    description: productData.description,
    price: productData.price,
    image: productData.image,
    count_in_stock: productData.count_in_stock,
    num_reviews: productData.num_reviews,
    rating: productData.rating,
    // ... ostala polja iz product tabele
    reviews: reviewRows.map((r) => ({
      review_id: r.review_id,
      rating: r.rating,
      comment: r.comment,
      user_id: r.user_id,
      user_name: r.user_name,
      created_at: r.created_at,
    })),
  };

  res.json(product);
});
// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const userId = req.user.user_id; // pretpostavljam da auth middleware setuje ovo
  const userName = req.user.name;

  // 1. Provera da li proizvod postoji
  const [productRows] = await db.execute(
    "SELECT * FROM Product WHERE product_id = ?",
    [productId]
  );

  if (productRows.length === 0) {
    res.status(404);
    throw new Error("Product not found");
  }

  // 2. Provera da li je korisnik već ostavio review
  const [existingReview] = await db.execute(
    "SELECT * FROM Review WHERE product_id = ? AND user_id = ?",
    [productId, userId]
  );

  if (existingReview.length > 0) {
    res.status(400);
    throw new Error("Product already reviewed");
  }

  // 3. Dodavanje novog review-a
  await db.execute(
    `INSERT INTO Review (product_id, user_id, name, rating, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [productId, userId, userName, rating, comment]
  );

  // 4. Ponovno izračunavanje prosečne ocene i broja review-a
  const [reviews] = await db.execute(
    "SELECT rating FROM Review WHERE product_id = ?",
    [productId]
  );

  const numReviews = reviews.length;
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews;

  // 5. Update Product tabele
  await db.execute(
    "UPDATE Product SET num_reviews = ?, rating = ? WHERE product_id = ?",
    [numReviews, avgRating, productId]
  );

  res.status(201).json({ message: "Review added" });
});

export { getProducts, getProductById, createProductReview };
