const User = require("../models/userModel");
const Task = require("../models/taskModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toLocaleDateString("en-GB");

    if (user.lastResetDate !== today) {
      user.dailyEnergyLimit = 100;
      user.lastResetDate = today;
      await user.save();

      await Task.updateMany({ user: user._id }, { isPlannedForToday: false });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserEnergy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.dailyEnergyLimit = req.body.dailyEnergyLimit;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    dailyEnergyLimit: 100,
    lastResetDate: new Date().toLocaleDateString("en-GB"),
  });

  res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateUserEnergy,
};
