//ako je production, onda "" jer je isti domen
// export const BASE_URL =
//   process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";

// export const BASE_URL = dev === "development" ? "http://localhost:5000" : "";

//da bi rešio cors error, isti je domen
//praktično, na frontu si rekao u proxy delu u .json da ti je default path ova gore i
//ovako si napravio duplikat iste

export const BASE_URL = "";
export const PRODUCTS_URL = "/api/products";
export const USERS_URL = "/api/users";
export const ORDERS_URL = "/api/orders";
export const STRIPE_URL = "/api/config/stripe";
