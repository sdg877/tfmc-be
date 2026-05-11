const User = require("../models/userModel");
const Task = require("../models/taskModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

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

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;

    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .select("-password")
      .lean();

    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Backend Error:", err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

const updateUserEnergy = async (req, res) => {
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
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getGoogleAuthUrl = (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  res.json({ url });
};

const connectGoogleCalendar = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code)
      return res
        .status(400)
        .json({ message: "No authorisation code provided" });

    const { tokens } = await oauth2Client.getToken(code);

    const updateData = {
      googleConnected: true,
      googleTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      },
    };

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Google Sync Error:", error);
    res.status(500).json({ message: "Failed to connect to Google Calendar" });
  }
};

const getGoogleEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.googleConnected)
      return res.status(400).json({ message: "Google account not linked" });

    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 15,
      singleEvents: true,
      orderBy: "startTime",
    });
    res.json(response.data.items);
  } catch (error) {
    console.error("Fetch Events Error:", error);
    res.status(500).json({ message: "Could not fetch calendar events" });
  }
};

const addGoogleEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // 1. Validation
    if (!user || !user.googleConnected || !user.googleTokens?.refreshToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    const { title, description, startTime, endTime } = req.body;

    oauth2Client.setCredentials({
      refresh_token: user.googleTokens.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: title,
      description: description || "Task added via The Fast Minds Club",
      start: {
        dateTime: startTime,
        timeZone: "Europe/London",
      },
      end: {
        dateTime: endTime,
        timeZone: "Europe/London",
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 10 }],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Google Sync Error:", error);

    if (error.code === 401 || error.response?.data?.error === "invalid_grant") {
      await User.findByIdAndUpdate(req.user.id, {
        googleConnected: false,
        $set: { "googleTokens.accessToken": null },
      });
      return res
        .status(401)
        .json({ message: "Google session expired. Please reconnect." });
    }

    res.status(500).json({ message: "Failed to create Google Calendar event" });
  }
};

const updateGoogleEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { eventId, title, startTime, endTime } = req.body;

    if (!user || !user.googleConnected) {
      return res.status(400).json({ message: "Google account not linked" });
    }

    oauth2Client.setCredentials({
      refresh_token: user.googleTokens.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.patch({
      calendarId: "primary",
      eventId: eventId,
      resource: {
        summary: title,
        start: { dateTime: startTime, timeZone: "Europe/London" },
        end: { dateTime: endTime, timeZone: "Europe/London" },
      },
    });

    res.json({ message: "Google event updated successfully" });
  } catch (error) {
    console.error("Google Update Error:", error);
    res.status(500).json({ message: "Failed to update Google event" });
  }
};

const getDailyEnergyUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.googleConnected)
      return res.json({ googleEnergyDrain: 0 });

    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
    });

    const events = response.data.items;

    const mappings =
      user.calendarMapping && user.calendarMapping.length > 0
        ? user.calendarMapping
        : [
            { keyword: "meeting", points: 20 },
            { keyword: "doctor", points: 40 },
            { keyword: "dentist", points: 40 },
            { keyword: "call", points: 10 },
          ];

    let googleDrain = 0;

    events.forEach((event) => {
      const title = event.summary ? event.summary.toLowerCase() : "";

      const match = mappings.find((m) =>
        title.includes(m.keyword.toLowerCase()),
      );

      if (match) {
        googleDrain += match.points;
      } else {
        googleDrain += 5;
      }
    });

    res.json({ googleEnergyDrain: googleDrain, eventCount: events.length });
  } catch (error) {
    console.error("Energy Calculation Error:", error);
    res.status(500).json({ message: "Error calculating energy" });
  }
};

const deleteGoogleEvent = async (user, googleEventId) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
    });
  } catch (err) {
    if (err.code === 404) {
      return;
    }
    console.error(
      "Google Delete Error Details:",
      err.response?.data || err.message,
    );
    throw err;
  }
};

const disconnectGoogle = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      googleConnected: false,
      googleTokens: {},
    });
    res.json({ message: "Disconnected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to disconnect" });
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
  updateUserProfile,
  updateUserEnergy,
  connectGoogleCalendar,
  getGoogleEvents,
  addGoogleEvent,
  getDailyEnergyUsage,
  getGoogleAuthUrl,
  disconnectGoogle,
  deleteGoogleEvent,
  updateGoogleEvent,
};
