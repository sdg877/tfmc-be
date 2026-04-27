const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dailyEnergyLimit: { type: Number, default: 100 },
    lastResetDate: { type: String, default: "" },
    settings: { showEnergyBar: { type: Boolean, default: true } },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
