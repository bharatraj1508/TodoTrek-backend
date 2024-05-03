const express = require("express");
const mongoose = require("mongoose");
const Task = mongoose.model("Task");
const Project = mongoose.model("Project");
const Category = mongoose.model("Category");
const requireToken = require("../../middlewares/requireToken");
const verifyOwner = require("../../middlewares/verifyOwner");
const router = express.Router();

router.use(requireToken);

const populateTask = (query) => {
  return query
    .populate("owner", "_id firstName lastName email")
    .populate("categoryId", "-tasks")
    .populate("projectId", "name color");
};

/*
@type     -   POST
@route    -   /create
@desc     -   Endpoint to create a new task.
@access   -   private
*/
router.post("/create", async (req, res) => {
  const { body, dueDate, priority } = req.body;
  const id = req.query.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const project = await Project.findById(id);
    const category = await Category.findById(id);

    if (project) {
      var projectId = project._id;
      var projectTask = true;
    }
    if (category) {
      var categoryId = category._id;
      var projectTask = false;
    }

    if (!projectId && !categoryId) {
      return res.status(400).json({
        message: "Provided id does not exist for any project or category",
      });
    }

    const newTask = new Task({
      body,
      dueDate,
      priority,
      projectId,
      categoryId,
      owner: req.user._id,
      projectTask,
    });

    await newTask.save();

    if (project) {
      await Project.findByIdAndUpdate(projectId, {
        $push: { tasks: newTask._id },
      });
    }

    if (category) {
      await Category.findByIdAndUpdate(categoryId, {
        $push: { tasks: newTask._id },
      });
    }

    const savedTask = await populateTask(Task.findById(newTask._id));
    res.status(200).json(savedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /
@desc     -   Endpoint to get all tasks for single project(pid), category(cid) or user (uid).
@access   -   private
*/
router.get("/", async (req, res) => {
  const { pid, cid, uid } = req.query;
  const sortBy = req.query.sortBy;

  const queryParamsCount = [pid, cid, uid].filter(Boolean).length;

  if (queryParamsCount > 1) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }

  let filter = {};
  if (pid) filter.projectId = pid;
  if (cid) filter.categoryId = cid;
  if (uid) filter.owner = uid;
  if (!pid && !cid && !uid) filter.owner = req.user._id;

  let query = Task.find(filter);
  if (sortBy === "priority") query = query.sort({ priority: -1 });

  try {
    const tasks = await populateTask(query);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /:id
@desc     -   Endpoint to get a single task by id.
@access   -   private
*/
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  // Check if the provided ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID format" });
  }

  try {
    const task = await populateTask(Task.findById(id));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   PATCH
@route    -   /:id
@desc     -   Endpoint to update the completion status of a task.
@access   -   private
*/
router.patch("/change-completion/:id", async (req, res) => {
  const { id } = req.params;
  const { isCompleted } = req.body;

  try {
    const task = await Task.findByIdAndUpdate(id, { $set: { isCompleted } });
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   PATCH
@route    -   /:id
@desc     -   Endpoint to update a task.
@access   -   private
*/
router.patch("/:id", verifyOwner(Task), async (req, res) => {
  const { id } = req.params;
  const { body, dueDate, priority, projectId, categoryId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID format" });
  }
  const originalTask = await Task.findById(id);

  if (originalTask.isCompleted) {
    return res
      .status(403)
      .json({ message: "Completed task cannot be updated" });
  }

  if (
    originalTask.projectId &&
    projectId.toString() !== originalTask.projectId.toString()
  ) {
    await Project.findByIdAndUpdate(originalTask.projectId, {
      $pull: { tasks: id },
    });

    if (categoryId) {
      await Category.findByIdAndUpdate(categoryId, {
        $push: { tasks: id },
      });
    } else if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        $push: { tasks: id },
      });
    }
    console.log("first condition");
  }

  if (
    originalTask.categoryId &&
    categoryId &&
    categoryId.toString() !== originalTask.categoryId.toString()
  ) {
    await Category.findByIdAndUpdate(originalTask.categoryId, {
      $pull: { tasks: id },
    });

    await Category.findByIdAndUpdate(categoryId, {
      $push: { tasks: id },
    });
  }

  if (originalTask.categoryId && !categoryId && projectId) {
    await Category.findByIdAndUpdate(originalTask.categoryId, {
      $pull: { tasks: id },
    });

    await Project.findByIdAndUpdate(projectId, {
      $push: { tasks: id },
    });
  }

  if (
    !originalTask.categoryId &&
    categoryId &&
    projectId.toString() == originalTask.projectId.toString()
  ) {
    await Project.findByIdAndUpdate(originalTask.projectId, {
      $pull: { tasks: id },
    });
    await Category.findByIdAndUpdate(categoryId, {
      $push: { tasks: id },
    });

    console.log("forth condition");
  }

  try {
    if (categoryId) {
      const update = {
        $set: {
          body,
          dueDate,
          priority,
          categoryId,
          updatedAt: Date.now(),
        },
        $unset: { projectId: "" },
      };
      var newTask = await populateTask(Task.updateOne({ _id: id }, update));
    }

    if (categoryId == "") {
      const update = {
        $set: {
          body,
          dueDate,
          priority,
          projectId,
          updatedAt: Date.now(),
        },
        $unset: { categoryId: "" },
      };

      var newTask = await populateTask(Task.updateOne({ _id: id }, update));
    }

    if (!newTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(newTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   DELETE
@route    -   /:id
@desc     -   Endpoint to delete a task.
@access   -   private
*/
router.delete("/:id", verifyOwner(Task), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID format" });
  }
  try {
    const task = await Task.deleteOne({ _id: id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task successfully deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
