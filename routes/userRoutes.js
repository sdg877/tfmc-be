const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUserEnergy,
  getProfile,
  connectGoogleCalendar,
  getGoogleEvents,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Authentication Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile & Settings Routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateUserEnergy);

// Google Calendar Integration
router.post("/sync-calendar", protect, connectGoogleCalendar);
router.get("/calendar-events", protect, getGoogleEvents);

module.exports = router;
