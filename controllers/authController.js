const User = require("../models/userModel");
const Task = require("../models/taskModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

exports.getProfile = async (req, res) => {
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

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;

    await user.save();
    const updatedUser = await User.findById(req.user.id).select("-password").lean();
    return res.status(200).json(updatedUser);
  } catch (err) {
    return res.status(500).json({ msg: "Server Error" });
  }
};

exports.updateUserEnergy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (req.body.dailyEnergyLimit !== undefined) {
      user.dailyEnergyLimit = req.body.dailyEnergyLimit;
    }
    if (req.body.settings) {
      user.settings = { ...user.settings, ...req.body.settings };
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

exports.registerUser = async (req, res) => {
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

exports.loginUser = async (req, res) => {
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