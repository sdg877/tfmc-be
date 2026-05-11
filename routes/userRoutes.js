const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// 1. Import from Auth Controller
const {
  registerUser,
  loginUser,
  getProfile,
  updateUserProfile,
  updateUserEnergy,
} = require("../controllers/authController");

// 2. Import from Google Controller
const {
  connectGoogleCalendar,
  getGoogleEvents,
  getDailyEnergyUsage,
  addGoogleEvent,
  updateGoogleEvent,
  disconnectGoogle,
} = require("../controllers/googleController");

// 3. Import from Category Controller
const {
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// --- Auth & Identity Routes ---
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile/identity", protect, updateUserProfile);
router.put("/profile/energy", protect, updateUserEnergy);

// --- Google Calendar Routes ---
router.post("/sync-calendar", protect, connectGoogleCalendar);
router.get("/calendar-events", protect, getGoogleEvents);
router.post("/calendar/add", protect, addGoogleEvent);
router.put("/calendar/update", protect, updateGoogleEvent);
router.get("/energy-usage", protect, getDailyEnergyUsage);
router.post("/calendar/disconnect", protect, disconnectGoogle);

// --- Custom Category Routes ---
router.post("/categories", protect, addCategory);
router.put("/categories/:categoryId", protect, updateCategory);
router.delete("/categories/:categoryId", protect, deleteCategory);

module.exports = router;
