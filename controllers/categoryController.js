const User = require("../models/userModel");

exports.addCategory = async (req, res) => {
  try {
    const { name, weight } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          categories: {
            name,
            weight: Number(weight),
            isCustom: true,
          },
        },
      },
      { new: true },
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to add category" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, weight } = req.body;

    const updateData = {};
    if (name) updateData["categories.$.name"] = name;
    if (weight !== undefined)
      updateData["categories.$.weight"] = Number(weight);

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, "categories._id": categoryId },
      { $set: updateData },
      { new: true },
    );

    if (!user)
      return res.status(404).json({ message: "User or category not found" });
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
      { new: true },
    );
    res.json(user.categories);
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

exports.resetCategories = async (req, res) => {
  // Using your exact defaults from the User model
  const defaultCategories = [
    { name: "Admin", weight: 10 },
    { name: "Physical", weight: 20 },
    { name: "Social", weight: 30 },
    { name: "Focus", weight: 40 },
    { name: "Stress", weight: 45 },
  ];

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { categories: defaultCategories } },
      { new: true },
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.categories);
  } catch (error) {
    res.status(500).json({ message: "Reset failed" });
  }
};
