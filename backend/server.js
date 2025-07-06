import express from "express";
import dotenv from "dotenv";
dotenv.config();
import productRoutes from "./routes/productRoutes.js";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const port = process.env.PORT || 5000;

const app = express();

// async IIFE
(async () => {
  try {
    await connectDB(); // konekcija se pravi samo jednom

    const app = express();

    app.get("/", (req, res) => {
      res.send("API is running...");
    });

    app.use("/api/products", productRoutes);

    app.use(notFound);
    app.use(errorHandler);

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error(" DB connection failed", error);
    process.exit(1);
  }
})();
