const express = require("express");
const mongoose = require("mongoose");
const Project = mongoose.model("Project");
const Task = mongoose.model("Task");
const Category = mongoose.model("Category");
const requireToken = require("../../middlewares/requireToken");
const verifyProjectOwner = require("../../middlewares/verifyOwner");
const router = express.Router();

router.use(requireToken);

// Function to populate project data
const populateProject = (query) => {
  return query
    .populate("owner", "_id firstName lastName email")
    .populate({
      path: "tasks",
      select: "-projectId -owner",
      options: { sort: { isCompleted: 1, priority: -1 } },
    })
    .populate({
      path: "categories",
      select: "-project",
      populate: {
        path: "tasks",
        select: "-categoryId -owner",
        options: { sort: { isCompleted: 1, priority: -1 } },
      },
    });
};

/*
@type     -   POST
@route    -   /create
@desc     -   Endpoint to create a new project.
@access   -   private
*/
router.post("/create", async (req, res) => {
  const { name, color, favourites } = req.body;
  try {
    const project = new Project({
      name,
      color,
      favourites,
      owner: req.user._id,
    });
    await project.save();
    const savedProject = await populateProject(Project.findById(project._id));
    res.status(200).json(savedProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /user
@desc     -   Endpoint to get all projects for a single user. 
                (if no id provided than the projects of logged in user)
@access   -   private
*/
router.get("/user", async (req, res) => {
  const { id } = req.query;
  const userId = id ? id : req.user._id;
  try {
    const projects = await populateProject(Project.find({ owner: userId }));
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /:id
@desc     -   Endpoint to get a single project by id.
@access   -   private
*/
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID format" });
  }

  try {
    const project = await populateProject(Project.findById(id));
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   PATCH
@route    -   /:id
@desc     -   Endpoint to update a project.
@access   -   private
*/
router.patch("/:id", verifyProjectOwner(Project), async (req, res) => {
  const { id } = req.params;
  const { name, color, favourites, categories, tasks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID format" });
  }

  try {
    const project = await populateProject(
      Project.findByIdAndUpdate(
        id,
        { name, color, favourites, categories, tasks, updatedAt: Date.now() },
        { new: true }
      )
    );
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   DELETE
@route    -   /:id
@desc     -   Endpoint to delete a project.
@access   -   private
*/
router.delete("/:id", verifyProjectOwner(Project), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID format" });
  }
  try {
    const project = await Project.deleteOne({ _id: id });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project successfully deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
