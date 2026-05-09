const Task = require("../models/taskModel");

const getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user.id });
  res.json(tasks);
};

const setTask = async (req, res) => {
  try {
    const { title, energyRequired, urgency, dueDate, category, notes } =
      req.body;

    const task = await Task.create({
      title,
      energyRequired,
      urgency,
      dueDate,
      category,
      notes: notes || "",
      user: req.user.id,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Not found" });
  }

  if (task.user.toString() !== req.user.id) {
    return res.status(401).json({ message: "User not authorised" });
  }

  const updateData = { ...req.body };

  if (updateData.isCompleted === true && !task.isCompleted) {
    updateData.completedAt = new Date();
  } else if (updateData.isCompleted === false && task.isCompleted) {
    updateData.completedAt = null;
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  });

  res.json(updated);
};

const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Not found" });

  if (task.user.toString() !== req.user.id) {
    return res.status(401).json({ message: "User not authorised" });
  }

  await task.deleteOne();
  res.json({ id: req.params.id });
};

module.exports = { getTasks, setTask, updateTask, deleteTask };
