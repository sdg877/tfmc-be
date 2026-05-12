const mongoose = require("mongoose");

const defaultCategories = [
  { name: "Social", weight: 10 },
  { name: "Physical", weight: 15 },
  { name: "Admin", weight: 20 },
  { name: "Focus", weight: 25 },
  { name: "Stress", weight: 35 },
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
    useManualWeights: { type: Boolean, default: false },
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
