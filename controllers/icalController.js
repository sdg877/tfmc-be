const User = require("../models/userModel");
const ical = require("node-ical");

exports.connectIcal = async (req, res) => {
  try {
    let { icalUrl } = req.body;
    if (!icalUrl)
      return res.status(400).json({ message: "No iCal URL provided" });

    icalUrl = icalUrl.replace(/^webcal:\/\//i, "https://");

    const events = await ical.async.fromURL(icalUrl);
    if (!events)
      return res.status(400).json({ message: "Could not parse iCal URL" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { icalUrl, icalConnected: true },
      { new: true },
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error("iCal Connect Error:", err);
    res
      .status(500)
      .json({
        message: "Failed to connect iCal feed. Check the URL is valid.",
      });
  }
};

exports.disconnectIcal = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { icalUrl: "", icalConnected: false },
      { new: true },
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error("iCal Disconnect Error:", err);
    res.status(500).json({ message: "Failed to disconnect iCal feed" });
  }
};

// Get today's iCal events
exports.getIcalEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.icalConnected || !user.icalUrl) return res.json([]);

    const rawEvents = await ical.async.fromURL(user.icalUrl);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayEvents = Object.values(rawEvents)
      .filter((event) => {
        if (event.type !== "VEVENT") return false;
        const start = new Date(event.start);
        return start >= today && start < tomorrow;
      })
      .map((event) => ({
        id: event.uid,
        summary: event.summary || "Untitled",
        description: event.description || "",
        location: event.location || "",
        start: { dateTime: new Date(event.start).toISOString() },
        end: { dateTime: new Date(event.end).toISOString() },
        source: "ical",
      }));

    res.json(todayEvents);
  } catch (err) {
    console.error("iCal Events Error:", err);
    res.status(500).json({ message: "Failed to fetch iCal events" });
  }
};

// Get all upcoming iCal events (for calendar view)
exports.getIcalCalendarEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.icalConnected || !user.icalUrl) return res.json([]);

    const rawEvents = await ical.async.fromURL(user.icalUrl);

    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(now.getDate() + 30);

    const upcomingEvents = Object.values(rawEvents)
      .filter((event) => {
        if (event.type !== "VEVENT") return false;
        const start = new Date(event.start);
        return start >= now && start <= thirtyDaysAhead;
      })
      .map((event) => ({
        id: event.uid,
        summary: event.summary || "Untitled",
        description: event.description || "",
        location: event.location || "",
        start: { dateTime: new Date(event.start).toISOString() },
        end: { dateTime: new Date(event.end).toISOString() },
        source: "ical",
      }));

    res.json(upcomingEvents);
  } catch (err) {
    console.error("iCal Calendar Events Error:", err);
    res.status(500).json({ message: "Failed to fetch iCal calendar events" });
  }
};

// Calculate energy drain from today's iCal events (mirrors getDailyEnergyUsage)
exports.getIcalEnergyUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.icalConnected || !user.icalUrl) {
      return res.json({ icalEnergyDrain: 0 });
    }

    const rawEvents = await ical.async.fromURL(user.icalUrl);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayEvents = Object.values(rawEvents).filter((event) => {
      if (event.type !== "VEVENT") return false;
      const start = new Date(event.start);
      return start >= today && start < tomorrow;
    });

    const mappings =
      user.calendarMapping?.length > 0
        ? user.calendarMapping
        : [
            { keyword: "meeting", points: 20 },
            { keyword: "doctor", points: 40 },
            { keyword: "call", points: 10 },
          ];

    let icalDrain = 0;
    todayEvents.forEach((event) => {
      const title = (event.summary || "").toLowerCase();
      const match = mappings.find((m) =>
        title.includes(m.keyword.toLowerCase()),
      );
      icalDrain += match ? match.points : 5;
    });

    res.json({ icalEnergyDrain: icalDrain, eventCount: todayEvents.length });
  } catch (err) {
    console.error("iCal Energy Error:", err);
    res.status(500).json({ message: "Failed to calculate iCal energy" });
  }
};
