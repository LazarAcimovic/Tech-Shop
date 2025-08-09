// import mysql from "mysql";
import mysql from "mysql2/promise";

//
// //kreiranje konekcije
// const connectDB = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   port: 3306,
//   database: Tech_Shop,
// });

let connection;

const connectDB = async () => {
  if (!connection) {
    try {
      connection = await mysql.createConnection({
        host: "localhost",
        user: "root",

        database: "tech_shop",
        port: 3306,
        charset: "utf8mb4",
      });

      console.log("✅ MySQL connected...");
    } catch (error) {
      console.error(" Connection failed:", error.message);
      process.exit(1);
    }
  }

  return connection;
};

export default connectDB;
