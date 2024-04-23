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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  categories: [
    {
      category: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Category",
      },
    },
  ],
  tasks: [
    {
      task: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Task",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

projectSchema.pre("deleteOne", async function (next) {
  const projectId = this.getQuery()["_id"];

  try {
    /*
    THe reason we are deleting categories one by one becuase
    for each category we have tasks that is dependent on it
    and in order to delete those tasks categories model is using deleteOne hook
    We cannot use deleteMany hook in categories model 
    becuase the logic for deleting the tasks will then be complex.
    */

    const projectCategories = await mongoose
      .model("Category")
      .find({ project: projectId })
      .select("_id");
    projectCategories.map(async (category) => {
      await mongoose.model("Category").deleteOne({ _id: category._id });
    });

    await mongoose.model("Task").deleteMany({ projectId: projectId });
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Project", projectSchema);
