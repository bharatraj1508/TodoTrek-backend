const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: false,
  },
  priority: {
    type: Number,
    enum: [1, 2, 3],
    required: false,
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Task", taskSchema);
