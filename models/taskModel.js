const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    energyRequired: {
        type: Number,
        required: [true, 'Please add energy level']
    },
    urgency: {
        type: String,
        required: true,
        enum: ['later', 'soon', 'now'],
        default: 'soon'
    },
    dueDate: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);