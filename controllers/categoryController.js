const User = require("../models/userModel");

exports.addCategory = async (req, res) => {
  try {
    const { name, weight } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { categories: { name, weight, isCustom: true } } },
      { new: true }
    );
    res.json(user.categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to add category" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { weight } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, "categories._id": categoryId },
      { $set: { "categories.$.weight": weight } },
      { new: true }
    );
    res.json(user.categories);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { categories: { _id: categoryId } } },
      { new: true }
    );
    res.json(user.categories);
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};