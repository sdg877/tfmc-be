// const express = require("express");
// const router = express.Router();
// const { protect } = require("../middleware/authMiddleware");

// const {
//   registerUser,
//   loginUser,
//   getProfile,
//   updateUserProfile,
//   updateUserEnergy,
//   getHolidays,
//   updateHolidays
// } = require("../controllers/authController");

// const {
//   connectGoogleCalendar,
//   getGoogleEvents,
//   addGoogleEvent,
//   updateGoogleEvent,
//   getDailyEnergyUsage,
//   deleteGoogleEvent,
//   disconnectGoogle,
// } = require("../controllers/googleController");

// const {
//   addCategory,
//   updateCategory,
//   deleteCategory,
//   resetCategories,
// } = require("../controllers/categoryController");

// // --- Auth ---
// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.get("/profile", protect, getProfile);
// router.put("/profile/identity", protect, updateUserProfile);
// router.put("/profile/energy", protect, updateUserEnergy);

// // --- Google ---
// router.post("/sync-calendar", protect, connectGoogleCalendar);
// router.get("/calendar-events", protect, getGoogleEvents);
// router.post("/calendar/add", protect, addGoogleEvent);
// router.put("/calendar/update", protect, updateGoogleEvent);
// router.get("/energy-usage", protect, getDailyEnergyUsage);
// router.delete("/calendar/event/:eventId", protect, deleteGoogleEvent);
// router.post("/calendar/disconnect", protect, disconnectGoogle);

// // --- Categories ---
// router.post("/categories", protect, addCategory);
// router.put("/categories/:categoryId", protect, updateCategory);
// router.delete("/categories/:categoryId", protect, deleteCategory);
// router.post("/categories/reset", protect, resetCategories);

// // -- Holiday Mode --
// router.get("/holidays", protect, getHolidays);
// router.put("/holidays", protect, updateHolidays);

// module.exports = router;

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  getProfile,
  updateUserProfile,
  updateUserEnergy,
  getHolidays,
  updateHolidays,
} = require("../controllers/authController");

const {
  connectGoogleCalendar,
  getGoogleEvents,
  addGoogleEvent,
  updateGoogleEvent,
  getDailyEnergyUsage,
  deleteGoogleEvent,
  disconnectGoogle,
} = require("../controllers/googleController");

const {
  connectIcal,
  disconnectIcal,
  getIcalEvents,
  getIcalCalendarEvents,
  getIcalEnergyUsage,
} = require("../controllers/icalController");

const {
  addCategory,
  updateCategory,
  deleteCategory,
  resetCategories,
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
router.post("/calendar/disconnect", protect, disconnectGoogle);

// --- iCal ---
router.post("/ical/connect", protect, connectIcal);
router.post("/ical/disconnect", protect, disconnectIcal);
router.get("/ical/events", protect, getIcalEvents);
router.get("/ical/calendar-events", protect, getIcalCalendarEvents);
router.get("/ical/energy-usage", protect, getIcalEnergyUsage);

// --- Categories ---
router.post("/categories", protect, addCategory);
router.put("/categories/:categoryId", protect, updateCategory);
router.delete("/categories/:categoryId", protect, deleteCategory);
router.post("/categories/reset", protect, resetCategories);

// --- Holiday Mode ---
router.get("/holidays", protect, getHolidays);
router.put("/holidays", protect, updateHolidays);

module.exports = router;