import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
//createApi umesto createSlice (koji se ne bavi sa async stuff)

//fetchBaseQuery - f-ja koja omogućava da pravimo req ka backend API
import { BASE_URL } from "../constants";

const baseQuery = fetchBaseQuery({ baseUrl: BASE_URL });

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ["user", "product", "orders", "orderitem", "review"],
  endpoints: () => ({}), //inicijalno prazno, indirektno injektovanje iz drugih fajlova
});
