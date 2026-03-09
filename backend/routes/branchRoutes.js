const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");
const { createBranch, getBranches } = require("../controllers/branchController");

router.post("/", auth, requireRole("super_admin", "company_admin"), checkCompanyAccess, createBranch);
router.get("/", auth, requireRole("super_admin", "company_admin", "branch_manager"), checkCompanyAccess, getBranches);

module.exports = router;