const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUserEnergy,
  getProfile,
  connectGoogleCalendar,
  getGoogleEvents,
  getDailyEnergyUsage,
  addGoogleEvent,
  updateUserProfile,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile Identity
router.put("/profile/identity", protect, updateUserProfile);
router.put("/profile/energy", protect, updateUserEnergy);

// General Profile
router.get("/profile", protect, getProfile);

// Google
router.post("/sync-calendar", protect, connectGoogleCalendar);
router.get("/calendar-events", protect, getGoogleEvents);
router.post("/calendar/add", protect, addGoogleEvent);
router.get("/energy-usage", protect, getDailyEnergyUsage);

module.exports = router;
