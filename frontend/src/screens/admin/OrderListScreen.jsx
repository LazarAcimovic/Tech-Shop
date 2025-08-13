import { useGetOrdersQuery } from "../../slices/ordersApiSlice";
import "../../assets/styles/custom.css";
import React, { useState } from "react";

const OrderListScreen = () => {
  const { data: orders, isLoading, error } = useGetOrdersQuery();
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error?.data?.message || error.error}</p>;

  const showTransactionDetails = (index) => {
    setSelectedIndex(index);
  };

  return (
    <div className="orders-container">
      {/* Lista narudžbina */}
      <div className="orders-list">
        <h3>Orders</h3>
        <ul>
          {orders.map((order, i) => (
            <li
              key={order.order_id}
              className={i === selectedIndex ? "selected" : ""}
              onClick={() => showTransactionDetails(i)}
            >
              Order ID: {order.order_id} —{" "}
              {order.isPaid ? "Successfully paid" : `$${order.totalAmount}`}
            </li>
          ))}
        </ul>
      </div>

      {/* Detalji */}
      <div className="order-details">
        <h2>Transaction Details</h2>
        <p>
          <strong>Order ID:</strong> {orders[selectedIndex]?.order_id}
        </p>
        <p>
          <strong>Shipping Price:</strong> $
          {orders[selectedIndex]?.shippingPrice}
        </p>
        <p>
          <strong>Tax Price:</strong> ${orders[selectedIndex]?.taxPrice}
        </p>
        <p>
          <strong>Total Amount:</strong> ${orders[selectedIndex]?.totalAmount}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(orders[selectedIndex]?.created_at).toLocaleString()}
        </p>

        <h3>Items:</h3>
        <ul>
          {orders[selectedIndex]?.items.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong> — Qty: {item.qty} — Price: $
              {item.price} — Buyer: {item.user_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OrderListScreen;
