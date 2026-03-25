const Lead = require("../models/Lead");
const Activity = require("../models/Activity");

const POINTS = {
    SENT: 5,
    DELIVERED: 10,
    READ: 25
};

const calculateRating = (score) => {
    if (score <= 20) return 1;
    if (score <= 40) return 2;
    if (score <= 60) return 3;
    if (score <= 80) return 4;
    return 5;
};

const updateLeadEngagement = async (leadId, points, eventType = null, companyId = null) => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) return;

        let newScore = (lead.engagementScore || 0) + points;
        if (newScore > 100) newScore = 100;

        const newRating = calculateRating(newScore);

        await Lead.findByIdAndUpdate(leadId, {
            engagementScore: newScore,
            rating: newRating
        });

        // Log activity if an event type is provided
        if (eventType && companyId) {
            await Activity.create({
                leadId,
                companyId,
                userId: null, // System event
                type: "engagement",
                note: `${eventType} engagement tracked. Current Rating: ${newRating} stars.`
            });
        }

        return { score: newScore, rating: newRating };
    } catch (error) {
        console.error("ENGAGEMENT TRACKING ERROR:", error);
    }
};

module.exports = { updateLeadEngagement, POINTS };
