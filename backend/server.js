import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import path from "path";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;

const app = express();

//body parser middleware
app.use(express.json()); //samo za raw json
app.use(express.urlencoded({ extended: true }));
const __dirname = path.resolve(); //root putanja do projekta
app.use(express.static(path.join(__dirname, "public"))); //služi sve fajlove iz public foldera kao statičke fajlove
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
    app.use("/api/orders", orderRoutes);

    app.post("/create-checkout-session", async (req, res) => {
      const { products } = req.body;

      const lineItems = products.map((product) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [`http://localhost:5000${product.image}`], // apsolutni URL
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: product.qty,
      }));

      //kreiramo checkout sesiju
      //vraća objekat koji stripe vraća kada se kreira checkout sesija
      //sadrži npr status plaćanja, url istog itd
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url:
          "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:5173/cancel",
      });

      //ovaj id služi da inicira korisnika na checkout stranicu
      res.json({ id: session.id });
    });

    app.use(notFound);
    app.use(errorHandler);

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error(" DB connection failed", error);
    process.exit(1);
  }
})();
