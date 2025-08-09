import { createSlice } from "@reduxjs/toolkit";
import { updateCart } from "../utils/cartUtils";

//produkti će se čuvati u local storage
const initialState = localStorage.getItem("cart")
  ? JSON.parse(localStorage.getItem("cart"))
  : { cartItems: [] };

const cartSlice = createSlice({
  name: "cart", //slice's name
  initialState,
  reducers: {
    addToCart: (state, action) => {
      //state - trenutni state od cart
      //action - podaci u okviru payload
      //itemu koji dodajemo pristupamo sa actin.payload
      const product = action.payload;

      const existProduct = state.cartItems.find(
        (x) => x.product_id === product.product_id
      );

      //da nam ne dodaje duplikate ako korisnik doda u korpu 2 ista proizvoda
      if (existProduct) {
        state.cartItems = state.cartItems.map((x) =>
          x.product_id === existProduct.product_id ? product : x
        );
      } else {
        state.cartItems = [...state.cartItems, product];
      }

      return updateCart(state);
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (x) => x.product_id !== action.payload
      );

      return updateCart(state);
    },
  },
});

export const { addToCart, removeFromCart } = cartSlice.actions;

export default cartSlice.reducer; // za update redux store
