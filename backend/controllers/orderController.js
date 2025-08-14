import { db } from "../routes/productRoutes.js";
import asyncHandler from "../middleware/asyncHandler.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Private

const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  try {
    // Početak transakcije
    await db.beginTransaction();

    // Kreiranje narudžbine u Orders tabeli
    const [orderResult] = await db.execute(
      `INSERT INTO Orders (
        user_id, 
        shipping_address, 
        shipping_city, 
        shipping_postal_code, 
        shipping_country, 
        payment_method, 
        items_price, 
        tax_price, 
        shipping_price, 
        total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.postalCode,
        shippingAddress.country,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      ]
    );

    if (orderResult.affectedRows === 0) {
      throw new Error("Failed to create order");
    }

    const orderId = orderResult.insertId;
    console.log(orderId);

    // Kreiranje stavki narudžbine u OrderItem tabeli
    for (const item of orderItems) {
      await db.execute(
        `INSERT INTO OrderItem (
          order_id, 
          product_id, 
          name, 
          qty, 
          image, 
          price
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.qty, item.image, item.price]
      );
    }

    // Potvrda transakcije
    await db.commit();

    const [order] = await db.execute(
      `SELECT * FROM Orders WHERE order_id = ?`,
      [orderId]
    );
    const [orderItemsResult] = await db.execute(
      `SELECT * FROM OrderItem WHERE order_id = ?`,
      [orderId]
    );

    const response = {
      order_id: order[0].order_id,
      user: order[0].user_id,
      shippingAddress: {
        address: order[0].shipping_address,
        city: order[0].shipping_city,
        postalCode: order[0].shipping_postal_code,
        country: order[0].shipping_country,
      },
      paymentMethod: order[0].payment_method,
      itemsPrice: order[0].items_price,
      taxPrice: order[0].tax_price,
      shippingPrice: order[0].shipping_price,
      totalPrice: order[0].total_price,
      isPaid: order[0].is_paid,
      paidAt: order[0].paid_at,
      isDelivered: order[0].is_delivered,
      deliveredAt: order[0].delivered_at,
      createdAt: order[0].created_at,
      updatedAt: order[0].updated_at,
      orderItems: orderItemsResult.map((item) => ({
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        product: item.product_id, // Mapiranje product_id na product
        orderItem_id: item.orderItem_id, // Mapiranje orderItem_id na _id
      })),
    };

    res.status(201).json(response);
  } catch (error) {
    await db.rollback();
    res.status(400);
    throw new Error(`Order creation failed: ${error.message}`);
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/mine
// @access  Private

const getMyOrders = asyncHandler(async (req, res) => {
  const [orders] = await db.execute("SELECT * FROM orders WHERE user_id = ?", [
    req.user.user_id,
  ]);

  res.status(200).json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  // Dohvatanje narudžbine i korisnika
  const [orderRows] = await db.execute(
    `SELECT o.*, u.name, u.email
     FROM Orders o
     JOIN _user u ON o.user_id = u.user_id
     WHERE o.order_id = ?`,
    [req.params.id]
  );

  if (orderRows.length === 0) {
    res.status(404);
    throw new Error("Order not found");
  }

  const [orderItems] = await db.execute(
    `SELECT orderItem_id , product_id, name, qty, image, price
     FROM OrderItem
     WHERE order_id = ?`,
    [req.params.id]
  );

  const order = {
    order_id: orderRows[0].order_id,
    user: {
      user_id: orderRows[0].user_id,
      name: orderRows[0].name,
      email: orderRows[0].email,
    },
    orderItems: orderItems.map((item) => ({
      orderItem_id: item.orderItem_id,
      product: item.product_id,
      name: item.name,
      qty: item.qty,
      image: item.image,
      price: item.price,
    })),
    shippingAddress: {
      address: orderRows[0].shipping_address,
      city: orderRows[0].shipping_city,
      postalCode: orderRows[0].shipping_postal_code,
      country: orderRows[0].shipping_country,
    },
    paymentMethod: orderRows[0].payment_method,
    paymentResult: {
      id: orderRows[0].payment_result_id,
      status: orderRows[0].payment_result_status,
      update_time: orderRows[0].payment_result_update_time,
      email_address: orderRows[0].payment_result_email,
    },
    itemsPrice: orderRows[0].items_price,
    taxPrice: orderRows[0].tax_price,
    shippingPrice: orderRows[0].shipping_price,
    totalPrice: orderRows[0].total_price,
    isPaid: orderRows[0].is_paid,
    paidAt: orderRows[0].paid_at,
    isDelivered: orderRows[0].is_delivered,
    deliveredAt: orderRows[0].delivered_at,
    createdAt: orderRows[0].created_at,
    updatedAt: orderRows[0].updated_at,
  };

  res.status(200).json(order);
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  // Ažuriranje narudžbine
  const [updateResult] = await db.execute(
    `UPDATE Orders
     SET is_paid = TRUE,
         paid_at = NOW()
     WHERE order_id = ?`,
    [req.params.id]
  );

  if (updateResult.affectedRows === 0) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.status(200).json({ message: "Order updated to paid" });
});

// @desc    Update order to delivered
// @route   GET /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const orderId = req.params.id;

  // Provera da li order postoji
  const [rows] = await db.execute("SELECT * FROM orders WHERE order_id = ?", [
    orderId,
  ]);

  if (rows.length === 0) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Ažuriranje ordera
  await db.execute(
    "UPDATE orders SET is_delivered = ?, delivered_at = ? WHERE order_id = ?",
    [true, new Date(), orderId]
  );

  // Ponovo dohvatimo ažurirani red
  const [updatedRows] = await db.execute(
    "SELECT * FROM orders WHERE order_id = ?",
    [orderId]
  );

  res.json(updatedRows[0]);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const [transactions] = await db.execute(`
    SELECT 
      tr.id AS transaction_id,
      tr.order_id,
      tr.shippingPrice,
      tr.taxPrice,
      tr.totalAmount,
      tr.created_at,
      u.name AS user_name,
      ti.id AS item_id,
      ti.product_name,
      ti.qty,
      ti.price
    FROM TransactionResult tr
    JOIN TransactionItems ti ON tr.id = ti.transaction_id
    JOIN Orders o ON tr.order_id = o.order_id
    JOIN _User u ON o.user_id = u.user_id
    ORDER BY tr.created_at DESC
  `);

  const grouped = {};
  transactions.forEach((row) => {
    if (!grouped[row.transaction_id]) {
      grouped[row.transaction_id] = {
        order_id: row.order_id,
        shippingPrice: row.shippingPrice,
        taxPrice: row.taxPrice,
        totalAmount: row.totalAmount,
        created_at: row.created_at,
        items: [],
      };
    }
    grouped[row.transaction_id].items.push({
      id: row.item_id,
      name: row.product_name,
      user_name: row.user_name, // ažurirano ime korisnika iz _User
      qty: row.qty,
      price: row.price,
    });
  });

  res.json(Object.values(grouped));
});

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getOrders,
};
