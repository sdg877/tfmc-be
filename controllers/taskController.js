const Task = require("../models/taskModel");
const User = require("../models/userModel");
const googleController = require("./googleController");

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

exports.setTask = async (req, res) => {
  try {
    const {
      title,
      energyRequired,
      urgency,
      dueDate,
      category,
      notes,
      addToGoogle,
    } = req.body;
    const user = await User.findById(req.user.id);

    let googleId = "";
    if (addToGoogle && user.googleConnected) {
      const eventData = await createGoogleEventLogic(user, {
        title,
        notes,
        dueDate,
      });
      googleId = eventData.id;
    }

    const task = await Task.create({
      title,
      energyRequired,
      urgency,
      dueDate,
      category,
      notes: notes || "",
      user: req.user.id,
      googleEventId: googleId,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.category !== undefined) task.category = req.body.category;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.notes !== undefined) task.notes = req.body.notes;
    if (req.body.urgency !== undefined) task.urgency = req.body.urgency;
    if (req.body.isStarred !== undefined) task.isStarred = req.body.isStarred;
    if (req.body.isPlannedForToday !== undefined)
      task.isPlannedForToday = req.body.isPlannedForToday;

    if (req.body.googleEventId !== undefined) {
      task.googleEventId = req.body.googleEventId;
    }

    if (req.body.isCompleted !== undefined) {
      task.isCompleted = req.body.isCompleted;
      task.completedAt = req.body.isCompleted ? new Date() : null;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();
    res.json({ message: "Task removed" });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};
