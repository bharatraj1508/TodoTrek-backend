const express = require("express");
const mongoose = require("mongoose");
const Category = mongoose.model("Category");
const Project = mongoose.model("Project");
const requireToken = require("../../middlewares/requireToken");
const verifyOwner = require("../../middlewares/verifyOwner");
const router = express.Router();

router.use(requireToken);

// Function to populate category data
const populateCategory = (query) => {
  return query.populate("tasks", "-categoryId");
};

/*
@type     -   POST
@route    -   /create
@desc     -   Endpoint to create a new category.
@access   -   private
*/
router.post("/create/:pid", verifyOwner(Project), async (req, res) => {
  const { name } = req.body;
  const projectId = req.params.pid;
  try {
    const category = new Category({
      name,
      project: projectId,
    });
    await category.save();

    const savedCategory = await populateCategory(
      Category.findById(category._id)
    );
    if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        $push: { categories: savedCategory._id },
      });
    }
    res.status(200).json(savedCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /category/project/:pid
@desc     -   Endpoint to get all categories for the given project id (pid).
@access   -   private
*/
router.get("/project/:pid", async (req, res) => {
  const { pid } = req.params;
  try {
    const categories = await populateCategory(Category.find({ project: pid }));
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /:id
@desc     -   Endpoint to get a single category by id.
@access   -   private
*/
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID format" });
  }

  try {
    const category = await populateCategory(Category.findById(id));
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   PATCH
@route    -   /:id
@desc     -   Endpoint to update a category.
@access   -   private
*/
router.patch("/:id", verifyOwner(Category), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID format" });
  }

  try {
    const category = await populateCategory(
      Category.findByIdAndUpdate(
        id,
        { name, updatedAt: Date.now() },
        { new: true }
      )
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ category });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   DELETE
@route    -   /:id
@desc     -   Endpoint to delete a category.
@access   -   private
*/
router.delete("/:id", verifyOwner(Category), async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID format" });
  }
  try {
    const category = await Category.deleteOne({ _id: req.params.id });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category successfully deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
