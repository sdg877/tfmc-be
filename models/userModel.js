const mongoose = require("mongoose");

const defaultCategories = [
  { name: "admin", weight: 10 },
  { name: "physical", weight: 20 },
  { name: "social", weight: 30 },
  { name: "focus", weight: 40 },
  { name: "stress", weight: 45 },
];

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dailyEnergyLimit: { type: Number, default: 100 },
    lastResetDate: { type: String, default: "" },
    settings: {
      showEnergyBar: { type: Boolean, default: true },
    },
    googleConnected: {
      type: Boolean,
      default: false,
    },
    googleTokens: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Number,
    },
    calendarMapping: [
      {
        keyword: { type: String },
        points: { type: Number },
        category: { type: String },
      },
    ],
    categories: {
      type: [
        {
          name: { type: String, required: true },
          weight: { type: Number, required: true },
          isCustom: { type: Boolean, default: false },
        },
      ],
      default: defaultCategories,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
