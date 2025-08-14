import { db } from "../routes/productRoutes.js";
import asyncHandler from "../middleware/asyncHandler.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [user] = await db.execute("SELECT * FROM _user WHERE email = ?", [
    email,
  ]);

  // const plainTextPassword = "123456";
  // const hardcodedHash = await bcrypt.hash(plainTextPassword, 10);
  // const isTestMatch = await bcrypt.compare(plainTextPassword, hardcodedHash);

  // console.log(isTestMatch);

  //   console.log(email, password);

  if (user.length > 0) {
    const foundUser = user[0];
    console.log(foundUser.user_id);

    const enteredPassword = password;

    const isMatch = await bcrypt.compare(enteredPassword, foundUser.password);
    // console.log(isMatch);

    if (isMatch) {
      //kreiramo token
      generateToken(res, foundUser.user_id);

      res.status(200).json({
        user_id: user[0].user_id,
        name: user[0].name,
        email: user[0].email,
        isAdmin: user[0].is_admin,
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Provera da li su svi podaci prisutni
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields (name, email, password) are required");
  }

  // Hešovanje šifre
  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10); // Hešuj šifru sa 10 rundi
  } else {
    res.status(400);
    throw new Error("Password is required");
  }

  const [userExists] = await db.execute("SELECT * FROM _user WHERE email = ?", [
    email,
  ]);

  if (userExists.length > 0) {
    res.status(400);
    throw new Error("User already exists");
  }

  const [insertedUser] = await db.execute(
    "INSERT INTO _user (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword]
  );

  if (insertedUser.affectedRows > 0) {
    const [readInsertedUser] = await db.execute(
      "SELECT * FROM _user WHERE user_id = ?",
      [insertedUser.insertId]
    );

    generateToken(res, readInsertedUser[0].user_id);

    res.status(201).json({
      user_id: readInsertedUser[0].user_id,
      name: readInsertedUser[0].name,
      email: readInsertedUser[0].email,
      isAdmin: readInsertedUser[0].is_admin,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0), //ovako kažemo da cookie istekne ovog momenta
  });

  res.status(200).json({ message: "Logged out successsfully" });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const [user] = await db.execute("SELECT * FROM _user WHERE user_id = ?", [
    req.user.user_id,
  ]);

  if (user.length > 0) {
    res.json({
      user_id: user[0].user_id,
      name: user[0].name,
      email: user[0].email,
      is_admin: user[0].is_admin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  // Dohvatanje korisnika iz baze
  const [user] = await db.execute("SELECT * FROM _user WHERE user_id = ?", [
    req.user.user_id,
  ]);

  if (user.length > 0) {
    // Priprema podataka za ažuriranje
    const updatedData = {
      name: req.body.name || user[0].name,
      email: req.body.email || user[0].email,
      password: user[0].password, // Zadržavamo staru šifru po default-u
    };

    // hešujemo modifikovanu plain šifru
    if (req.body.password) {
      updatedData.password = await bcrypt.hash(req.body.password, 10);
    }

    // Ažuriranje korisnika u bazi
    const [result] = await db.execute(
      "UPDATE _user SET name = ?, email = ?, password = ? WHERE user_id = ?",
      [
        updatedData.name,
        updatedData.email,
        updatedData.password,
        req.user.user_id,
      ]
    );

    if (result.affectedRows > 0) {
      // Dohvatanje ažuriranog korisnika
      const [updatedUser] = await db.execute(
        "SELECT * FROM _user WHERE user_id = ?",
        [req.user.user_id]
      );

      if (updatedUser.length === 0) {
        res.status(500);
        throw new Error("Failed to retrieve updated user");
      }

      res.json({
        user_id: updatedUser[0].user_id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        isAdmin: updatedUser[0].is_admin || false,
      });
    } else {
      res.status(400);
      throw new Error("Failed to update user");
    }
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const [users] = await db.execute("SELECT * FROM _user");
  res.status(200).json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  // Prvo proveravamo da li korisnik postoji
  const [rows] = await db.execute("SELECT * FROM _user WHERE user_id = ?", [
    req.params.id,
  ]);

  if (rows.length > 0) {
    const user = rows[0];

    if (user.is_admin) {
      res.status(400);
      throw new Error("Cannot delete admin user");
    }

    await db.execute("DELETE FROM _user WHERE user_id = ?", [req.params.id]);

    res.status(200).json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const [rows] = await db.execute(
    "SELECT user_id, name, email, is_admin FROM _user WHERE user_id = ?",
    [req.params.id]
  );

  if (rows.length > 0) {
    res.status(200).json(rows[0]);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  // Prvo dohvatimo korisnika iz baze
  const [rows] = await db.execute("SELECT * FROM _user WHERE user_id = ?", [
    req.params.id,
  ]);

  if (rows.length === 0) {
    res.status(404);
    throw new Error("User not found");
  }

  const user = rows[0];

  // Postavljamo nove vrednosti (ako nisu poslati, ostaju stari podaci)
  const name = req.body.name || user.name;
  const email = req.body.email || user.email;
  const is_admin = req.body.is_admin ? 1 : 0;

  // Update u bazi
  await db.execute(
    "UPDATE _user SET name = ?, email = ?, is_admin = ? WHERE user_id = ?",
    [name, email, is_admin, req.params.id]
  );

  // Vraćamo ažurirane podatke
  res.json({
    user_id: req.params.id,
    name,
    email,
    is_admin,
  });
});

export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
};
