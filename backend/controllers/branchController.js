const Branch = require("../models/Branch");

// Create Branch
exports.createBranch = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    let companyId = req.user.companyId;

    if (req.user.role === "super_admin") {
      companyId = req.body.companyId || req.user.companyId;
    }

    const branch = await Branch.create({
      ...req.body,
      companyId
    });

    res.json({ success: true, message: "Branch Created Successfully", data: branch });

  } catch (error) {
    console.error("CREATE BRANCH ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Branches
exports.getBranches = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { search } = req.query;
    let query = {};

    if (req.user.role !== "super_admin") {
      query.companyId = req.user.companyId;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const branches = await Branch.find(query);

    res.json({ success: true, data: branches });

  } catch (error) {
    console.error("GET BRANCHES ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};