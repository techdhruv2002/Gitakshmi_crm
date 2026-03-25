const MessageTracking = require("../models/MessageTracking");
const { updateLeadEngagement, POINTS } = require("../utils/engagementTracker");

exports.trackEmailOpen = async (req, res) => {
    try {
        const { messageId } = req.params;
        const tracking = await MessageTracking.findOne({ messageId, type: "email" });

        if (tracking && tracking.status !== "read") {
            tracking.status = "read";
            tracking.openedAt = new Date();
            await tracking.save();

            // Find companyId from the lead associated with this message
            const Lead = require("../models/Lead");
            const lead = await Lead.findById(tracking.leadId);
            const companyId = lead?.companyId;

            // Update engagement score
            await updateLeadEngagement(tracking.leadId, POINTS.READ, "Email opened", companyId);

            // Emit real-time update
            const io = req.app.get("io");
            if (io && companyId) {
                io.to(`company:${companyId}`).emit("lead_updated", { leadId: tracking.leadId });
            }
        }

        // Return 1x1 transparent GIF
        const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
        res.writeHead(200, {
            "Content-Type": "image/gif",
            "Content-Length": pixel.length,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        });
        res.end(pixel);
    } catch (error) {
        console.error("EMAIL TRACKING ERROR:", error);
        // Fallback pixel
        res.status(200).send("");
    }
};

exports.verifyWhatsappWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log("WHATSAPP WEBHOOK VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
};

exports.whatsappWebhook = async (req, res) => {
    try {
        const body = req.body;
        console.log("WHATSAPP WEBHOOK RECEIVED:", JSON.stringify(body, null, 2));

        if (body.object === "whatsapp_business_account") {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value.statuses) {
                        for (const statusObj of change.value.statuses) {
                            const messageId = statusObj.id;
                            const status = statusObj.status; // "delivered", "read"

                            if (status === "delivered" || status === "read") {
                                const tracking = await MessageTracking.findOne({ messageId, type: "whatsapp" });
                                if (tracking) {
                                    // Calculate point addition
                                    let points = 0;
                                    if (status === "delivered" && tracking.status === "sent") {
                                        points = POINTS.DELIVERED;
                                        tracking.status = "delivered";
                                    } else if (status === "read" && (tracking.status === "sent" || tracking.status === "delivered")) {
                                        points = POINTS.READ;
                                        tracking.status = "read";
                                        tracking.openedAt = new Date();
                                    }

                                    if (points > 0) {
                                        await tracking.save();
                                        const Lead = require("../models/Lead");
                                        const lead = await Lead.findById(tracking.leadId);
                                        const companyId = lead?.companyId;

                                        await updateLeadEngagement(tracking.leadId, points, `WhatsApp message ${status}`, companyId);

                                        // Real-time
                                        const io = req.app.get("io");
                                        if (io && companyId) {
                                            io.to(`company:${companyId}`).emit("lead_updated", { leadId: tracking.leadId });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return res.status(200).send("EVENT_RECEIVED");
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error("WHATSAPP WEBHOOK ERROR:", error);
        res.status(200).send("EVENT_RECEIVED"); // Meta wants 200 even on error to avoid retry storm
    }
};
