const User = require("../models/userModel");
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const setupGoogleAuth = (user, userId) => {
  oauth2Client.setCredentials({
    access_token: user.googleTokens.accessToken,
    refresh_token: user.googleTokens.refreshToken,
    expiry_date: user.googleTokens.expiryDate,
  });

  oauth2Client.removeAllListeners("tokens");
  oauth2Client.on("tokens", async (tokens) => {
    const update = {
      "googleTokens.accessToken": tokens.access_token,
      "googleTokens.expiryDate": tokens.expiry_date,
    };
    if (tokens.refresh_token) {
      update["googleTokens.refreshToken"] = tokens.refresh_token;
    }
    await User.findByIdAndUpdate(userId, { $set: update });
  });
};

exports.getGoogleAuthUrl = (req, res) => {
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

exports.connectGoogleCalendar = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code)
      return res
        .status(400)
        .json({ message: "No authorisation code provided" });

    const { tokens } = await oauth2Client.getToken(code);
    const currentUser = await User.findById(req.user.id);

    const updateData = {
      googleConnected: true,
      googleTokens: {
        accessToken: tokens.access_token,
        refreshToken:
          tokens.refresh_token || currentUser.googleTokens?.refreshToken,
        expiryDate: tokens.expiry_date,
      },
    };

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      returnDocument: "after",
    }).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Google Connect Error:", error);
    res.status(500).json({ message: "Failed to connect to Google Calendar" });
  }
};

exports.getGoogleEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.googleConnected) return res.json([]);

    setupGoogleAuth(user, req.user.id);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items);
  } catch (error) {
    console.error("Fetch Events Error:", error);
    res.status(500).json({ message: "Could not fetch events" });
  }
};

exports.addGoogleEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.googleConnected || !user.googleTokens?.refreshToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    setupGoogleAuth(user, req.user.id);

    const { title, description, startTime, endTime } = req.body;
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: title,
      description: description || "Task added via The Fast Minds Club",
      start: { dateTime: startTime, timeZone: "Europe/London" },
      end: { dateTime: endTime, timeZone: "Europe/London" },
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
    if (error.code === 401 || error.response?.data?.error === "invalid_grant") {
      await User.findByIdAndUpdate(req.user.id, { googleConnected: false });
    }
    console.error("Add Event Error:", error);
    res.status(500).json({ message: "Sync failed" });
  }
};

exports.updateGoogleEvent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.googleConnected) {
      return res.status(400).json({ message: "Google account not connected" });
    }

    setupGoogleAuth(user, req.user.id);

    const { eventId, title, description, startTime, endTime } = req.body;
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.patch({
      // Use patch to only update changed fields
      calendarId: "primary",
      eventId: eventId,
      resource: {
        summary: title,
        description: description,
        start: { dateTime: startTime, timeZone: "Europe/London" },
        end: { dateTime: endTime, timeZone: "Europe/London" },
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Google Update Error:", error);
    res.status(500).json({ message: "Failed to update Google event" });
  }
};

exports.deleteGoogleEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId || eventId === "undefined" || eventId === "null") {
      return res.status(200).json({ message: "No event ID to delete" });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.googleConnected) {
      return res.status(400).json({ message: "Google account not connected" });
    }

    setupGoogleAuth(user, req.user.id);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });

    return res
      .status(200)
      .json({ message: "Google event deleted successfully" });
  } catch (error) {
    if (error.code === 404 || error.code === 410) {
      return res
        .status(200)
        .json({ message: "Event already gone from Google" });
    }
    console.error("Google Delete Error:", error.message);
    return res.status(500).json({ message: "Failed to delete Google event" });
  }
};

exports.getDailyEnergyUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.googleConnected)
      return res.json({ googleEnergyDrain: 0 });

    setupGoogleAuth(user, req.user.id);

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
      user.calendarMapping?.length > 0
        ? user.calendarMapping
        : [
            { keyword: "meeting", points: 20 },
            { keyword: "doctor", points: 40 },
            { keyword: "call", points: 10 },
          ];

    let googleDrain = 0;
    events.forEach((event) => {
      const title = (event.summary || "").toLowerCase();
      const match = mappings.find((m) =>
        title.includes(m.keyword.toLowerCase()),
      );
      googleDrain += match ? match.points : 5;
    });

    res.json({ googleEnergyDrain: googleDrain, eventCount: events.length });
  } catch (error) {
    console.error("Energy Usage Error:", error);
    res.status(500).json({ message: "Error calculating energy" });
  }
};

exports.disconnectGoogle = async (req, res) => {
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
