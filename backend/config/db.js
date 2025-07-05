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

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3306,
      database: "tech_shop",
    });

    console.log(`MySQL Connected...`);
    return connection;
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
