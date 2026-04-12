const Task = require('../models/taskModel');

const getTasks = async (req, res) => {
    const tasks = await Task.find();
    res.json(tasks);
};

// const setTask = async (req, res) => {
//     const { title, energyRequired, urgency, dueDate, user } = req.body;

//     if (!title || !energyRequired || !urgency) {
//         return res.status(400).json({ message: 'Missing fields' });
//     }

//     const task = await Task.create({
//         title,
//         energyRequired,
//         urgency,
//         dueDate,
//         user
//     });

//     res.status(201).json(task);
// };

const setTask = async (req, res) => {
    try {
        const { title, energyRequired, urgency, dueDate } = req.body;

        // The "await" here is CRITICAL
        const task = await Task.create({
            title,
            energyRequired,
            urgency,
            dueDate,
            user: req.user.id 
        });

        res.status(201).json(task);
    } catch (error) {
        // This will tell us if MongoDB rejected the data
        res.status(400).json({ message: error.message });
    }
};

const updateTask = async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
};

const deleteTask = async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });

    await task.deleteOne();
    res.json({ id: req.params.id });
};

module.exports = { getTasks, setTask, updateTask, deleteTask };