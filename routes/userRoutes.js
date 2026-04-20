const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUserEnergy,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.put("/profile", protect, updateUserEnergy);

module.exports = router;
