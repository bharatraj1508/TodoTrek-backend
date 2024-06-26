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
    enum: [0, 1, 2, 3],
    required: false,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "Project",
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "Category",
  },
  projectTask: {
    type: Boolean,
    required: false,
    default: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

taskSchema.pre("deleteOne", async function (next) {
  const taskId = this.getQuery()["_id"];

  try {
    await mongoose
      .model("Project")
      .updateMany({}, { $pull: { tasks: taskId } });
    await mongoose
      .model("Category")
      .updateMany({}, { $pull: { tasks: taskId } });
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Task", taskSchema);
