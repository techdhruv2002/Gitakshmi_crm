const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* ================= CREATE USER ================= */
exports.createUser = async (req, res) => {
  try {

    // Only company_admin and branch_manager can create users
    const isCompanyAdmin = req.user.role === "company_admin";
    const isBranchManager = req.user.role === "branch_manager";

    if (!isCompanyAdmin && !isBranchManager) {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { name, email, password, role, branchId } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Security enforcement
    const targetBranchId = isBranchManager ? req.user.branchId : branchId || null;
    const targetRole = isBranchManager ? "sales" : role;

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: targetRole,
      companyId: req.user.companyId,
      branchId: targetBranchId
    });

    res.json({
      success: true,
      message: "User Created Successfully",
      data: newUser
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* ================= GET USERS ================= */
exports.getUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found in request" });
    }

    const { search, role } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role) filter.role = role;

    if (req.user.role !== "super_admin") {
      filter.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") {
        filter.branchId = req.user.branchId;
      }
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });

    res.json({ success: true, data: users });

  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE USER ================= */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }

    const query = { _id: id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const user = await User.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE USER ================= */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    if (req.user.role !== "company_admin" && req.user.role !== "branch_manager") {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }

    const query = { _id: id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    const deletedUser = await User.findOneAndDelete(query);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User identity purged successfully" });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};