import mysql from "mysql2/promise";
import connectDB from "./config/db.js";
import colors from "colors";
import users from "./data/users.js";
import products from "./data/products.js";
import bcrypt from "bcryptjs";

connectDB();

const importData = async () => {
  try {
    const db = await connectDB();

    // Ubacivanje korisnika
    const hashedUsers = users.map((user) => ({
      ...user,
      password: bcrypt.hashSync(user.password, 10),
    }));

    for (const user of hashedUsers) {
      await db.execute(
        "INSERT INTO user (name, email, password, is_admin) VALUES (?, ?, ?, ?)",
        [user.name, user.email, user.password, user.isAdmin]
      );
    }

    // Dobijamo admina
    const [createdUsers] = await db.execute("SELECT * FROM user");
    const adminUserId = createdUsers[0].user_id;

    // Ubacivanje proizvoda
    for (const product of products) {
      await db.execute(
        `INSERT INTO product 
        (user_id, name, image, brand, category, description, price, count_in_stock, rating, num_reviews) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adminUserId,
          product.name,
          product.image,
          product.brand,
          product.category,
          product.description,
          product.price,
          product.countInStock,
          product.rating,
          product.numReviews,
        ]
      );
    }

    console.log("Data injected".green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

importData();
