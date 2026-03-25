const express = require("express");
const router = express.Router();
const trackController = require("../controllers/trackController");

// Public routes for tracking
router.get("/email/:messageId", trackController.trackEmailOpen);
router.post("/webhook/whatsapp", trackController.whatsappWebhook);
router.get("/webhook/whatsapp", trackController.verifyWhatsappWebhook); // For Meta verification

module.exports = router;
