const Task = require("../models/Task");
const Lead = require("../models/Lead");
const User = require("../models/User");

// ── CREATE TASK ──────────────────────────────────────────────────────────────
exports.createTask = async (req, res) => {
    try {
        const { leadId, assignedTo, dueDate } = req.body;

        if (!leadId || !assignedTo || !dueDate) {
            return res.status(400).json({ success: false, message: "leadId, assignedTo, and dueDate are required." });
        }

        const task = await Task.create({
            leadId,
            assignedTo,
            dueDate,
            companyId: req.user.companyId,
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error("CREATE TASK ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET TASKS ─────────────────────────────────────────────────────────────────
exports.getTasks = async (req, res) => {
    try {
        let filter = { companyId: req.user.companyId };

        // Users might want to see their own tasks or all tasks if they're admin
        if (req.user.role === "sales") {
            filter.assignedTo = req.user.id;
        }

        const tasks = await Task.find(filter)
            .populate("leadId", "name email companyName")
            .populate("assignedTo", "name")
            .sort({ dueDate: 1 }); // Sort by closest due date

        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error("GET TASKS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── UPDATE TASK STATUS ────────────────────────────────────────────────────────
exports.updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["pending", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            { status },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        res.json({ success: true, data: task });
    } catch (error) {
        console.error("UPDATE TASK ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
