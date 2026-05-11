const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  getProfile,
  updateUserProfile,
  updateUserEnergy,
} = require("../controllers/authController");

const {
  connectGoogleCalendar,
  getGoogleEvents,
  addGoogleEvent,
  updateGoogleEvent,
  getDailyEnergyUsage,
  deleteGoogleEvent
} = require("../controllers/googleController");

const {
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// --- Auth ---
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile/identity", protect, updateUserProfile);
router.put("/profile/energy", protect, updateUserEnergy);

// --- Google ---
router.post("/sync-calendar", protect, connectGoogleCalendar);
router.get("/calendar-events", protect, getGoogleEvents);
router.post("/calendar/add", protect, addGoogleEvent);
router.put("/calendar/update", protect, updateGoogleEvent);
router.get("/energy-usage", protect, getDailyEnergyUsage);
router.delete("/calendar/event/:eventId", protect, deleteGoogleEvent);

// --- Categories ---
router.post("/categories", protect, addCategory);
router.put("/categories/:categoryId", protect, updateCategory);
router.delete("/categories/:categoryId", protect, deleteCategory);

module.exports = router;
