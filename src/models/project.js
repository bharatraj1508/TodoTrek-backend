const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  favourites: {
    type: Boolean,
    required: true,
    default: false,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  categories: [
    {
      name: {
        type: String,
        required: false,
      },
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Category",
      },
    },
  ],
  tasks: [
    {
      name: {
        type: String,
        required: false,
      },
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Task",
      },
    },
  ],
});

module.exports = mongoose.model("Project", projectSchema);
