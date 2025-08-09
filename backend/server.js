import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const port = process.env.PORT || 5000;

const app = express();

//body parser middleware
app.use(express.json()); //samo za raw json
app.use(express.urlencoded({ extended: true }));

//cookie parser middleware
app.use(cookieParser());

// async IIFE
(async () => {
  try {
    await connectDB(); // konekcija se pravi samo jednom

    app.get("/", (req, res) => {
      res.send("API is running...");
    });

    app.use("/api/products", productRoutes);
    app.use("/api/users", userRoutes);

    app.use(notFound);
    app.use(errorHandler);

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error(" DB connection failed", error);
    process.exit(1);
  }
})();
