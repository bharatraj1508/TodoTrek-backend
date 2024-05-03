const mongoose = require("mongoose");
const Project = mongoose.model("Project");

module.exports = (Model) => async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  const projectId = req.query.pid || req.params.pid;
  const categoryId = req.query.cid;
  var resource;

  if (!id && !projectId && !categoryId) {
    return next();
  }

  if ((id || projectId) && !mongoose.Types.ObjectId.isValid(id || projectId)) {
    return res.status(400).json({ message: "Invalid project ID format" });
  }

  try {
    if (projectId) {
      resource = await Model.findById(projectId);
    } else if (categoryId) {
      resource = await Model.findOne({ "categories.category": categoryId });
    } else {
      resource = await Model.findById(id);
    }
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (resource.owner) {
      if (resource.owner.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ message: "User not authorized to perform this action" });
      } else {
        return next();
      }
    } else {
      const pr = await Project.findById(resource.project);
      if (!pr || pr.owner.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ message: "User not authorized to perform this action" });
      } else {
        return next();
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
