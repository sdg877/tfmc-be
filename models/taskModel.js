const mongoose = require("mongoose");

const taskSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
    },
    notes: {
      type: String,
      default: "",
    },
    energyRequired: {
      type: Number,
      default: 3,
    },
    category: {
      type: String,
      enum: ["admin", "physical", "social", "focus", "stress"],
      required: [true, "Please select a category"],
    },
    urgency: {
      type: String,
      enum: ["later", "soon", "now"],
      default: "soon",
    },
    dueDate: {
      type: Date,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    isPlannedForToday: {
      type: Boolean,
      default: false,
    },
    googleEventId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Task", taskSchema);
