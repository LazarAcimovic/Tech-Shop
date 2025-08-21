import { db } from "../routes/productRoutes.js";
import asyncHandler from "../middleware/asyncHandler.js";

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 8;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword || "";

  // Prvo brojimo koliko proizvoda odgovara search-u
  const [countResult] = await db.execute(
    `SELECT COUNT(*) as count 
     FROM Product 
     WHERE name LIKE ?`,
    [`%${keyword}%`]
  );
  const count = countResult[0].count;

  const [products] = await db.execute(
    `SELECT * 
     FROM Product 
     WHERE name LIKE ? 
     LIMIT ? OFFSET ?`,
    [`%${keyword}%`, pageSize, pageSize * (page - 1)]
  );

  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
  });
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
    category: productData.category,
    count_in_stock: productData.count_in_stock,
    num_reviews: productData.num_reviews,
    rating: productData.rating,
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
  const userId = req.user.user_id;
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

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  // Ubacujemo "sample" proizvod u bazu
  const [result] = await db.execute(
    `
    INSERT INTO product 
      (name, price, user_id, image, brand, category, count_in_stock, num_reviews, description) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "Sample name",
      0,
      req.user.user_id, // ili req.user.user_id, zavisi od middleware-a
      "/images/sample.jpg",
      "Sample brand",
      "Sample category",
      0,
      0,
      "Sample description",
    ]
  );

  // Dohvatimo tek kreirani proizvod
  const [rows] = await db.execute(
    `SELECT * FROM product WHERE product_id = ?`,
    [result.insertId]
  );

  res.status(201).json(rows[0]);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

  // console.log(name, price, description, image, brand, category, countInStock);

  const [rows] = await db.execute(
    `SELECT * FROM product WHERE product_id = ?`,
    [req.params.product_id]
  );

  // console.log(req.params.product_id);

  if (rows.length === 0) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Ažuriramo proizvod
  await db.execute(
    `
    UPDATE product 
    SET name = ?, price = ?, description = ?, image = ?, brand = ?, category = ?, count_in_stock = ? 
    WHERE product_id = ?
    `,
    [
      name,
      price,
      description,
      image,
      brand,
      category,
      countInStock,
      req.params.product_id,
    ]
  );

  const [updatedRows] = await db.execute(
    `SELECT * FROM product WHERE product_id = ?`,
    [req.params.product_id]
  );

  res.json(updatedRows[0]);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.product_id;

  // Proverimo da li proizvod postoji
  const [rows] = await db.execute(
    "SELECT * FROM product WHERE product_id = ?",
    [productId]
  );

  if (rows.length > 0) {
    // Brišemo proizvod
    await db.execute("DELETE FROM product WHERE product_id = ?", [productId]);
    refetch();
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
  const [products] = await db.query(
    "SELECT * FROM product ORDER BY rating DESC LIMIT 3"
  );

  res.json(products);
});

const deleteProductReview = asyncHandler(async (req, res) => {
  const review_id = req.params.id;

  // Proverimo da li proizvod postoji
  const [rows] = await db.execute("SELECT * FROM review WHERE review_id = ?", [
    review_id,
  ]);

  if (rows.length > 0) {
    // Brišemo proizvod
    await db.execute("DELETE FROM review WHERE review_id = ?", [review_id]);
    refetch();
    res.json({ message: "Review removed" });
  } else {
    res.status(404);
    throw new Error("Review not found");
  }
});

export {
  getProducts,
  getProductById,
  createProductReview,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
  deleteProductReview,
};
