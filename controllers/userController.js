// const User = require('../models/userModel');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const registerUser = async (req, res) => {
//     const { name, email, password } = req.body;

//     // Check if all fields are there
//     if (!name || !email || !password) {
//         return res.status(400).json({ message: 'Please add all fields' });
//     }

//     // Check if user exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//         return res.status(400).json({ message: 'User already exists' });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create user
//     const user = await User.create({
//         name,
//         email,
//         password: hashedPassword
//     });

//     if (user) {
//         res.status(201).json({
//             _id: user.id,
//             name: user.name,
//             email: user.email,
//             token: generateToken(user._id)
//         });
//     } else {
//         res.status(400).json({ message: 'Invalid user data' });
//     }
// };

// const loginUser = async (req, res) => {
//     const { email, password } = req.body;

//     // Find user by email
//     const user = await User.findOne({ email });

//     // Check if user exists AND password matches
//     if (user && (await bcrypt.compare(password, user.password))) {
//         res.json({
//             _id: user.id,
//             name: user.name,
//             email: user.email,
//             token: generateToken(user._id),
//         });
//     } else {
//         res.status(401).json({ message: 'Invalid email or password' });
//     }
// };

// const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
// };

// module.exports = { registerUser, loginUser };

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        dailyEnergyLimit: 100 // Explicitly set default on creation
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            dailyEnergyLimit: user.dailyEnergyLimit, // Send to frontend
            token: generateToken(user._id)
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            dailyEnergyLimit: user.dailyEnergyLimit, // Send to frontend
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// NEW: Function to update the limit from the slider
const updateUserEnergy = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.dailyEnergyLimit = req.body.dailyEnergyLimit;
        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            dailyEnergyLimit: updatedUser.dailyEnergyLimit
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Add updateUserEnergy to the exports
module.exports = { registerUser, loginUser, updateUserEnergy };