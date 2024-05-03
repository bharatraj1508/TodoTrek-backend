const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Task",
    },
  ],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Project",
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

categorySchema.pre("deleteOne", async function (next) {
  const categoryId = this.getQuery()["_id"];

  try {
    await mongoose
      .model("Project")
      .updateMany({}, { $pull: { categories: categoryId } });
    await mongoose.model("Task").deleteMany({ categoryId: categoryId });
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Category", categorySchema);
