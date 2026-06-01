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

// exports.setTask = async (req, res) => {
//   try {
//     const {
//       title,
//       energyRequired,
//       urgency,
//       dueDate,
//       category,
//       notes,
//       addToGoogle,
//     } = req.body;
//     const user = await User.findById(req.user.id);

//     let googleId = "";
//     if (addToGoogle && user.googleConnected) {
//       const eventData = await createGoogleEventLogic(user, {
//         title,
//         notes,
//         dueDate,
//       });
//       googleId = eventData.id;
//     }

//     const task = await Task.create({
//       title,
//       energyRequired,
//       urgency,
//       dueDate,
//       category,
//       notes: notes || "",
//       user: req.user.id,
//       googleEventId: googleId,
//     });

//     res.status(201).json(task);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.updateTask = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ message: "Not found" });

//     if (req.body.title !== undefined) task.title = req.body.title;
//     if (req.body.category !== undefined) task.category = req.body.category;
//     if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
//     if (req.body.notes !== undefined) task.notes = req.body.notes;
//     if (req.body.urgency !== undefined) task.urgency = req.body.urgency;
//     if (req.body.isStarred !== undefined) task.isStarred = req.body.isStarred;
//     if (req.body.isPlannedForToday !== undefined)
//       task.isPlannedForToday = req.body.isPlannedForToday;

//     if (req.body.googleEventId !== undefined) {
//       task.googleEventId = req.body.googleEventId;
//     }

//     if (req.body.isCompleted !== undefined) {
//       task.isCompleted = req.body.isCompleted;
//       task.completedAt = req.body.isCompleted ? new Date() : null;
//     }

//     const updatedTask = await task.save();
//     res.json(updatedTask);
//   } catch (error) {
//     res.status(500).json({ message: "Update failed" });
//   }
// };

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
      isRecurring,    // Added
      recurrence,     // Added
    } = req.body;
    
    const user = await User.findById(req.user.id);

    let googleId = "";
    if (addToGoogle && user.googleConnected) {
      const eventData = await createGoogleEventLogic(user, { title, notes, dueDate });
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
      isRecurring: isRecurring || false, // Added
      recurrence: recurrence || "none",   // Added
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. Handle cloning upon completion
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Not found" });

    // Handle standard field updates
    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.category !== undefined) task.category = req.body.category;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.notes !== undefined) task.notes = req.body.notes;
    if (req.body.urgency !== undefined) task.urgency = req.body.urgency;
    if (req.body.isPlannedForToday !== undefined) task.isPlannedForToday = req.body.isPlannedForToday;
    if (req.body.googleEventId !== undefined) task.googleEventId = req.body.googleEventId;
    if (req.body.isRecurring !== undefined) task.isRecurring = req.body.isRecurring;
    if (req.body.recurrence !== undefined) task.recurrence = req.body.recurrence;

    // Handle completion logic
    if (req.body.isCompleted !== undefined) {
      const wasCompleted = task.isCompleted;
      task.isCompleted = req.body.isCompleted;
      task.completedAt = req.body.isCompleted ? new Date() : null;

      // If it's turning from uncompleted -> completed AND it is recurring
      if (!wasCompleted && task.isCompleted && task.isRecurring && task.recurrence !== "none") {
        
        // Calculate next due date cleanly
        let nextDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
        if (task.recurrence === "daily") {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (task.recurrence === "weekly") {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (task.recurrence === "monthly") {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        // Spawn the next iteration automatically
        await Task.create({
          user: task.user,
          title: task.title,
          notes: task.notes,
          energyRequired: task.energyRequired,
          category: task.category,
          urgency: task.urgency,
          dueDate: nextDueDate,
          isRecurring: true,
          recurrence: task.recurrence,
          isCompleted: false,
          isPlannedForToday: false,
        });
      }
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
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
