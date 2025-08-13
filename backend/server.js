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
import { db } from "./routes/productRoutes.js";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;

const app = express();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post(
  "/my-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const orderId = parseInt(session.metadata.order_id);
      const shippingPrice = parseFloat(session.metadata.shippingPrice);
      const taxPrice = parseFloat(session.metadata.taxPrice);
      const totalAmount = parseFloat(session.metadata.totalAmount);

      try {
        const [orderItems] = await db.execute(
          `SELECT name, price, qty FROM orderitem WHERE order_id = ?`,
          [orderId]
        );

        // getujemo usera
        const [orderRows] = await db.execute(
          `SELECT user_id FROM orders WHERE order_id = ?`,
          [orderId]
        );

        if (orderRows.length === 0) {
          console.error(`Order ${orderId} not found`);
          return res.status(404).send("Order not found");
        }

        const user_id = orderRows[0].user_id;

        const [userRows] = await db.execute(
          `SELECT name FROM _user WHERE user_id = ?`,
          [user_id]
        );

        const user_name = userRows[0].name;

        const [result] = await db.execute(
          `INSERT INTO transactionresult (order_id, shippingPrice, taxPrice, totalAmount, isPaid)
   VALUES (?, ?, ?, ?,?)`,
          [orderId, shippingPrice, taxPrice, totalAmount, true]
        );

        const transactionId = result.insertId;

        for (const item of orderItems) {
          await db.execute(
            `INSERT INTO transactionitems (transaction_id, product_name, user_name, qty, price)
     VALUES (?, ?, ?, ?, ?)`,
            [transactionId, item.name, user_name, item.qty, item.price]
          );
        }

        //   Ubaci svaki item u TransactionResult
        //   for (const item of orderItems) {
        //     await db.execute(
        //       `INSERT INTO TransactionResult
        //   (order_id, shippingPrice, taxPrice, totalAmount, qty, name, price)
        //  VALUES (?, ?, ?, ?, ?, ?, ?)`,
        //       [
        //         orderId,
        //         shippingPrice,
        //         taxPrice,
        //         totalAmount,
        //         item.qty,
        //         item.name,
        //         item.price,
        //       ]
        //     );
        //   }

        console.log(`Transaction saved for order ${orderId}`);
      } catch (err) {
        console.error("Error saving transaction data: ", err);
        return res.status(500).send("Internal Server Error");
      }
    }

    res.json({ received: true });
  }
);

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
      // const { products, order_id, taxPrice, shippingPrice } = req.body;
      const { products, order_id } = req.body;
      const cartItems = products.cartItems;
      const { shippingPrice, taxPrice, totalPrice } = products;
      console.log(order_id);

      const lineItems = cartItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: [`http://localhost:5000${item.image}`],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      }));

      if (shippingPrice > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: { name: "Shipping" },
            unit_amount: Math.round(shippingPrice * 100),
          },
          quantity: 1,
        });
      }

      if (taxPrice > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: { name: "Tax" },
            unit_amount: Math.round(taxPrice * 100),
          },
          quantity: 1,
        });
      }

      //kreiramo checkout sesiju
      //vraća objekat koji stripe vraća kada se kreira checkout sesija
      //sadrži npr status plaćanja, url istog itd
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`,
        cancel_url: "http://localhost:5173/cancel",
        metadata: {
          order_id: order_id.toString(),
          shippingPrice: shippingPrice.toString(),
          taxPrice: taxPrice.toString(),
          totalAmount: totalPrice.toString(),
        },
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
