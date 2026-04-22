// // const User = require('../models/userModel');
// // const bcrypt = require('bcryptjs');
// // const jwt = require('jsonwebtoken');

// // const registerUser = async (req, res) => {
// //     const { name, email, password } = req.body;

// //     // Check if all fields are there
// //     if (!name || !email || !password) {
// //         return res.status(400).json({ message: 'Please add all fields' });
// //     }

// //     // Check if user exists
// //     const userExists = await User.findOne({ email });
// //     if (userExists) {
// //         return res.status(400).json({ message: 'User already exists' });
// //     }

// //     // Hash password
// //     const salt = await bcrypt.genSalt(10);
// //     const hashedPassword = await bcrypt.hash(password, salt);

// //     // Create user
// //     const user = await User.create({
// //         name,
// //         email,
// //         password: hashedPassword
// //     });

// //     if (user) {
// //         res.status(201).json({
// //             _id: user.id,
// //             name: user.name,
// //             email: user.email,
// //             token: generateToken(user._id)
// //         });
// //     } else {
// //         res.status(400).json({ message: 'Invalid user data' });
// //     }
// // };

// // const loginUser = async (req, res) => {
// //     const { email, password } = req.body;

// //     // Find user by email
// //     const user = await User.findOne({ email });

// //     // Check if user exists AND password matches
// //     if (user && (await bcrypt.compare(password, user.password))) {
// //         res.json({
// //             _id: user.id,
// //             name: user.name,
// //             email: user.email,
// //             token: generateToken(user._id),
// //         });
// //     } else {
// //         res.status(401).json({ message: 'Invalid email or password' });
// //     }
// // };

// // const generateToken = (id) => {
// //     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// // };

// // module.exports = { registerUser, loginUser };

// const User = require('../models/userModel');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const registerUser = async (req, res) => {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//         return res.status(400).json({ message: 'Please add all fields' });
//     }

//     const userExists = await User.findOne({ email });
//     if (userExists) {
//         return res.status(400).json({ message: 'User already exists' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const user = await User.create({
//         name,
//         email,
//         password: hashedPassword,
//         dailyEnergyLimit: 100 // Explicitly set default on creation
//     });

//     if (user) {
//         res.status(201).json({
//             _id: user.id,
//             name: user.name,
//             email: user.email,
//             dailyEnergyLimit: user.dailyEnergyLimit, // Send to frontend
//             token: generateToken(user._id)
//         });
//     } else {
//         res.status(400).json({ message: 'Invalid user data' });
//     }
// };

// const loginUser = async (req, res) => {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });

//     if (user && (await bcrypt.compare(password, user.password))) {
//         res.json({
//             _id: user.id,
//             name: user.name,
//             email: user.email,
//             dailyEnergyLimit: user.dailyEnergyLimit, // Send to frontend
//             token: generateToken(user._id),
//         });
//     } else {
//         res.status(401).json({ message: 'Invalid email or password' });
//     }
// };

// // NEW: Function to update the limit from the slider
// const updateUserEnergy = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id);

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         user.dailyEnergyLimit = req.body.dailyEnergyLimit;
//         const updatedUser = await user.save();

//         res.json({
//             _id: updatedUser.id,
//             dailyEnergyLimit: updatedUser.dailyEnergyLimit
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// };

// const getProfile = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id).select('-password');
//         if (!user) return res.status(404).json({ message: 'User not found' });

//         const today = new Date().toLocaleDateString('en-GB');
//         const lastReset = user.lastResetDate; // You'll need to add this to your Model

//         // Check if it's a new day
//         if (lastReset !== today) {
//             // 1. Reset Energy to 100
//             user.dailyEnergyLimit = 100;
//             // 2. Update the reset date so it doesn't loop
//             user.lastResetDate = today;
            
//             await user.save();

//             // 3. Clear the 'Planned for Today' flags on all tasks
//             const Task = require('../models/taskModel');
//             await Task.updateMany(
//                 { user: user._id, isPlannedForToday: true },
//                 { isPlannedForToday: false }
//             );
//         }
        
//         res.json(user); 
//     } catch (error) {
//         console.error("Profile fetch/reset error:", error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

// const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// // Add updateUserEnergy to the exports
// module.exports = { registerUser, loginUser, updateUserEnergy, getProfile };

// const User = require('../models/userModel');
// const Task = require('../models/taskModel');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const getProfile = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id).select('-password');
//         if (!user) return res.status(404).json({ message: 'User not found' });

//         const today = new Date().toLocaleDateString('en-GB');

//         // MIDNIGHT RESET: If it's a new day, set limit back to 100
//         if (user.lastResetDate !== today) {
//             user.dailyEnergyLimit = 100; 
//             user.lastResetDate = today;
//             await user.save();
            
//             const Task = require('../models/taskModel');
//             await Task.updateMany({ user: user._id }, { isPlannedForToday: false });
//         }
        
//         // Ensure we send back the numeric limit
//         res.json({
//             _id: user._id,
//             dailyEnergyLimit: user.dailyEnergyLimit || 100
//         }); 
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// };

// // const getProfile = async (req, res) => {
// //     try {
// //         const user = await User.findById(req.user.id).select('-password');
// //         if (!user) return res.status(404).json({ message: 'User not found' });

// //         const today = new Date().toLocaleDateString('en-GB');
        
// //         // Midnight Reset Logic
// //         if (user.lastResetDate !== today) {
// //             user.dailyEnergyLimit = 100; // Reset capacity to 100%
// //             user.lastResetDate = today;  // Update reset date
// //             await user.save();

// //             // Clear all "Do Today" flags for the new day
// //             await Task.updateMany(
// //                 { user: user._id, isPlannedForToday: true },
// //                 { isPlannedForToday: false }
// //             );
// //         }
        
// //         res.json(user); 
// //     } catch (error) {
// //         res.status(500).json({ message: 'Server error' });
// //     }
// // };

// const updateUserEnergy = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id);
//         user.dailyEnergyLimit = req.body.dailyEnergyLimit;
//         const updatedUser = await user.save();
//         res.json(updatedUser);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// };

// const registerUser = async (req, res) => {
//     const { name, email, password } = req.body;
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     const user = await User.create({ name, email, password: hashedPassword, dailyEnergyLimit: 100, lastResetDate: new Date().toLocaleDateString('en-GB') });
//     res.status(201).json({ _id: user.id, name: user.name, email: user.email, token: generateToken(user._id) });
// };

// const loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (user && (await bcrypt.compare(password, user.password))) {
//         res.json({ _id: user.id, name: user.name, email: user.email, dailyEnergyLimit: user.dailyEnergyLimit, token: generateToken(user._id) });
//     } else {
//         res.status(401).json({ message: 'Invalid credentials' });
//     }
// };

// const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// module.exports = { registerUser, loginUser, getProfile, updateUserEnergy };

const User = require("../models/userModel");
const Task = require("../models/taskModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Get user profile
// @route   GET /users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toLocaleDateString("en-GB");

    // Midnight Reset Logic
    if (user.lastResetDate !== today) {
      user.dailyEnergyLimit = 100;
      user.lastResetDate = today;
      await user.save();

      // Wipe "Planned for Today" flags on tasks for the new day
      await Task.updateMany({ user: user._id }, { isPlannedForToday: false });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update energy limit
// @route   PUT /users/profile
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

// MAKE SURE ALL ARE EXPORTED HERE
module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateUserEnergy,
};