const Task = require("../models/taskModel");
const User = require("../models/userModel");
const { deleteGoogleEvent } = require("./googleController");

const getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user.id });
  res.json(tasks);
};

const setTask = async (req, res) => {
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

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });

    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.category !== undefined) task.category = req.body.category;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.notes !== undefined) task.notes = req.body.notes;

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
    console.error("Update Error:", error);
    res.status(500).json({ message: "Update failed" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const user = await User.findById(req.user.id);

    if (task.googleEventId && task.googleEventId.trim() !== "") {
      try {
        await deleteGoogleEvent(user, task.googleEventId);
      } catch (err) {
        console.error(
          "Google delete failed (maybe event was already gone?):",
          err.message,
        );
      }
    }

    await task.deleteOne();
    res.json({ message: "Task removed" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getTasks, setTask, updateTask, deleteTask };
