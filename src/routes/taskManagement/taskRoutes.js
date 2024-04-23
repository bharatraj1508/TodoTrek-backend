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
    .populate("categoryId", "name")
    .populate("projectId", "name color");
};

/*
@type     -   POST
@route    -   /create
@desc     -   Endpoint to create a new task.
@access   -   private
*/
router.post("/create", verifyOwner(Project), async (req, res) => {
  const { body, dueDate, priority } = req.body;
  const projectId = req.query.pid;
  const categoryId = req.query.cid;

  if (projectId && categoryId) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }

  try {
    const newTask = new Task({
      body,
      dueDate,
      priority,
      projectId,
      categoryId,
      owner: req.user._id,
    });
    await newTask.save();

    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).send({ message: "Project not found" });
      }
      await Project.findByIdAndUpdate(projectId, {
        $push: { tasks: { task: newTask._id } },
      });
    }

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).send({ message: "Category not found" });
      }
      await Category.findByIdAndUpdate(categoryId, {
        $push: { tasks: { task: newTask._id } },
      });
    }

    const savedTask = await populateTask(Task.findById(newTask._id));
    res.status(200).json({ task: savedTask });
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
  var tasks;

  const queryParamsCount = [pid, cid, uid].filter(Boolean).length;

  if (queryParamsCount > 1) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }

  try {
    if (pid) {
      tasks = await populateTask(Task.find({ projectId: pid }));
    } else if (cid) {
      tasks = await populateTask(Task.find({ categoryId: cid }));
    } else if (uid) {
      tasks = await populateTask(
        Task.find({
          projectId: { $exists: false },
          categoryId: { $exists: false },
          owner: uid,
        })
      );
    } else {
      tasks = await populateTask(Task.find({ owner: req.user._id }));
    }
    res.status(200).json({ tasks });
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
    res.status(200).json({ task });
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

  try {
    const task = await populateTask(
      Task.findByIdAndUpdate(
        id,
        {
          body,
          dueDate,
          priority,
          projectId,
          categoryId,
          updatedAt: Date.now(),
        },
        { new: true }
      )
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ task });
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
