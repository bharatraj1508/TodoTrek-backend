const mongoose = require("mongoose");
const taskSchema = require("./task").schema; // Assuming task model is defined in task.js

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tasks: {
    type: [mongoose.Schema.Types.ObjectId],
    required: false,
    ref: "Task",
  },
});

module.exports = mongoose.model("Category", categorySchema);
