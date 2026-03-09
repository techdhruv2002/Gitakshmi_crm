const Pipeline = require("../models/Pipeline");
const Stage = require("../models/Stage");

// ── GET ALL PIPELINES ────────────────────────────────────────────────────────
exports.getPipelines = async (req, res) => {
    try {
        const { companyId } = req.user;
        const pipelines = await Pipeline.find({ companyId });
        res.json({ success: true, data: pipelines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET PIPELINE STAGES ──────────────────────────────────────────────────────
exports.getPipelineStages = async (req, res) => {
    try {
        const { companyId } = req.user;
        const { pipelineId } = req.params;
        const stages = await Stage.find({ companyId, pipelineId }).sort({ order: 1 });
        res.json({ success: true, data: stages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── CREATE PIPELINE ─────────────────────────────────────────────────────────
exports.createPipeline = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { companyId, id: userId } = req.user;

        const pipeline = await Pipeline.create({
            name,
            description,
            companyId,
            createdBy: userId
        });

        res.status(201).json({ success: true, data: pipeline });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── CREATE STAGE ────────────────────────────────────────────────────────────
exports.createStage = async (req, res) => {
    try {
        const { name, pipelineId, order, probability, winLikelihood } = req.body;
        const { companyId, id: userId } = req.user;

        const stage = await Stage.create({
            name,
            pipelineId,
            order,
            probability,
            winLikelihood,
            companyId,
            createdBy: userId
        });

        res.status(201).json({ success: true, data: stage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
