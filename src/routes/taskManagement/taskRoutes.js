const express = require("express");
const mongoose = require("mongoose");
const Task = mongoose.model("Task");
const requireToken = require("../../middlewares/requireToken");
const router = express.Router();

router.use(requireToken);

/*
@type     -   POST
@route    -   /create
@desc     -   Endpoint to create a new task.
@access   -   private
*/
router.post("/create", async (req, res) => {
  const { body, dueDate, priority, projectId, categoryId } = req.body;
  try {
    const newTask = new Task({
      body,
      dueDate,
      priority,
      projectId,
      categoryId,
    });
    await newTask.save();
    res.status(200).json(newTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /all
@desc     -   Endpoint to get all tasks.
@access   -   private
*/
router.get("/all", async (req, res) => {
  try {
    const tasks = await Task.find();
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
    const task = await Task.findById(id);
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
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { body, dueDate, priority, projectId, categoryId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID format" });
  }

  try {
    const task = await Task.findByIdAndUpdate(
      id,
      { body, dueDate, priority, projectId, categoryId, updatedAt: Date.now() },
      { new: true }
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
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid task ID format" });
  }
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task successfully deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
