const express = require("express");
const router = express.Router();
const inquiryController = require("../controllers/inquiryController");
const auth = require("../middleware/auth");
const checkCompanyAccess = require("../middleware/checkCompanyAccess");

// ✅ auth FIRST — applies to ALL routes below including POST /
router.use(auth, checkCompanyAccess);

router.post("/", inquiryController.createInquiry);
router.get("/", inquiryController.getInquiries);
router.get("/:id", inquiryController.getInquiryById);
router.patch("/:id/assign", inquiryController.assignInquiry);
router.post("/:id/convert", inquiryController.convertInquiryToLead);
router.put("/:id/status", inquiryController.updateInquiryStatus);
router.delete("/:id", inquiryController.deleteInquiry);

module.exports = router;
